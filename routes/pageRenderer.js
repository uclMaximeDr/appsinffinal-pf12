const express = require('express');
const router = express.Router();
const { ObjectId } = require("mongodb");
const path = require('path');
const sharp = require('sharp');
const { formatDate, isFriend, hasSentRequest } = require('../utils');

// Middleware to check for first visit and captcha requirement
router.use((req, res, next) => {
    if(req.originalUrl.startsWith('/captcha') || req.originalUrl.startsWith('/api/')) {
        next();
        return;
    }
    
    if(!req.session.visited) { // Check if first visit
        req.session.visited = true;
        res.redirect('/start');
    } else if(req.session && req.session.needCaptcha) { // Check if need captcha
        res.redirect(`/captcha?next=${encodeURIComponent(req.originalUrl)}`);
    } else {
        if (
            !req.originalUrl.endsWith('/party/create')
            && !req.originalUrl.startsWith('/scripts')
            && !req.originalUrl.startsWith('/styles')
            && req.session.id_saved
        ) {
            req.session.id_saved = null;
        }
        next();
    }
});

// Routes
router.get('/', async function(req, res){

    //Recherche soirée database avec pseudo
    const database = req.app.locals.db;

    const parties = await database.collection('party').find().toArray();

    // Filtrer les soirées ayant plus de 7 jours
    const currentDate = new Date();
    const partiesSevenDays = parties.filter(party => {
        const partyDate = new Date(party.date);
        const diffTime = Math.abs(currentDate - partyDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    });

    const partiesInfo = await Promise.all(partiesSevenDays.map(async party => {
        // aggregate source Mongodb Documentation
        const totalRating = await database.collection('rating').aggregate([{ $match: { party_id : party._id } },{$group: {_id: null, totalSum: { $sum: { $toInt: "$rate"}}}}]).toArray();
        const totalRatingDoc = await database.collection('rating').countDocuments({ party_id : party._id });
        let total;
        if (totalRatingDoc != 0 && totalRating != 0){
            total = totalRating[0].totalSum/totalRatingDoc;
        }else{
            total = 0;
        }
        
        return {
            ...party,
            formattedDate: formatDate(party.date),
            user: {
                fullname: (await database.collection('users').findOne({_id : new ObjectId(party.user_id)})).fullname,
                isFriend: req.session.userid ? (await database.collection('friendship').findOne({ id_1: { $in: [new ObjectId(req.session.userid), new ObjectId(party.user_id)] }, id_2: { $in: [new ObjectId(req.session.userid), new ObjectId(party.user_id)] } }) != null) : false
            },
            image: (await database.collection('photos').findOne({partyId : party._id}))?._id || null,
            averageRating: total
        };
    }));
    const filteredFriend = partiesInfo.filter(party => {
        return !party.friendOnly || party.user.isFriend || party.user_id == req.session.userid;
    });

    const filteredRating = filteredFriend.sort((a,b)=>{
        return b.averageRating - a.averageRating;
    });


    res.render("index", {parties : filteredRating});
});

router.get('/start', (req, res) => {
    res.render("start");
});

router.get('/camera', (req, res) => {
    res.render("camera");
});

router.get('/captcha', (req, res) => {
    if (req.session) {
        req.session.needCaptcha = true;
    }
    res.render("captcha", {
        url: '/images/captcha.jpg',
        object: 'une bière'
    });
});

router.get('/user/login', (req, res) => {
    
    if(req.session && req.session.userid) {
        res.redirect("/user/profile/me");
        return;
    }

    res.render("user/login");
})

router.get('/user/profile/me', async (req, res) => {
    // Default function to get the profile page of the currently connected user

    const database = req.app.locals.db;
    const userid = req.session.userid;

    if (!userid) {
        return res.redirect("/user/login");
    }

    const user = await database.collection('users').findOne({ _id: new ObjectId(userid) });
    if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.redirect(`/user/profile/${user._id}`);
})

router.get('/user/profile/:id', async (req, res) => {
    const database = req.app.locals.db;
    const id = req.params.id;

    const user = await database.collection('users').findOne({ _id: new ObjectId(id) });

    if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // The currently connected user
    const connectedUser = await database.collection('users').findOne({ _id: new ObjectId(req.session.userid) });
    const isOwnProfile = connectedUser && connectedUser._id.equals(user._id);

    const parties = await database.collection('party').find({user_id : user._id}).map(async party => {
        return {
            ...party,
            formattedDate: formatDate(party.date),
            images: await (database.collection('photos').find({partyId : new ObjectId(party._id)})).map(photo => photo._id).toArray(),
            ratings: await database.collection('rating').find({party_id : new ObjectId(party._id)}).map(rating => parseInt(rating.rate)).toArray()
        };
    }).toArray();
    const averageRating = parties.map(party => {
        if (party.ratings.length === 0) return 0;
        const sum = party.ratings.reduce((a, b) => a + b, 0);
        return sum / party.ratings.length;
    }).reduce((a, b) => a + b, 0) / (parties.length || 1);

    // Infos about friendship with connected user
    const friendsList = new Array().concat(await database.collection('friendship').find({ id_2 : new ObjectId(user._id) }).toArray(),
                                        await database.collection('friendship').find({ id_1 : new ObjectId(user._id) }).toArray())

    
    const friends = friendsList.length;

    const isConnected = !!connectedUser;

    const Friend = await isFriend(database, req.session.userid, id) || await hasSentRequest(database, req.session.userid, id);

    res.render("user/profile", {
        username: user.fullname,
        rating : averageRating,
        parties : parties,
        friends : friends,
        isFriend : Friend,
        isOwnProfile : isOwnProfile,
        id: user._id,
        isConnected : isConnected
    });
})

router.get('/user/pendingInvites', async (req, res) => {

    const db = req.app.locals.db;
    
    if(!req.session || !req.session.userid) {
        res.redirect("/user/login");
        return;
    }

    const requests = await db.collection("friendRequest").find({ to_id: new ObjectId(req.session.userid) }).toArray();

    const requestsWithName = await Promise.all(requests.map(async request => {
        return {
            ...request,
            user: {
                fullname: (await db.collection('users').findOne({_id : new ObjectId( request.from_id )})).fullname
            }
        };
    }));

    res.render("user/pendingInvites", { requests: requestsWithName});
})
    

router.get('/user/edit', async (req, res) => {

    if(!req.session || !req.session.userid) {
        res.redirect("/user/login");
        return;
    }

    const database = req.app.locals.db;
    const user = await database.collection('users').findOne({ _id: new ObjectId(req.session.userid) });

    res.render("user/edit", { email: user.email, username: user.fullname });
});

// ### PARTY ###
router.get('/party/create', (req, res) => {
    if(!req.session || !req.session.userid) {
        res.redirect("/user/login");
        return;
    }
    res.render("party/create", {data_party : req.session.data_party, id_saved : req.session.id_saved});
});


//Affichage information de la soirée
router.get('/party/:id', async function(req, res){
    const database = req.app.locals.db;
    let vote_tot = [];


    const party = await database.collection('party').findOne({ _id: new ObjectId(req.params.id) });
    const formattedDate = formatDate(party.date);
    const user = await database.collection('users').findOne({ _id: new ObjectId(party.user_id) });
    const rating = await database.collection('rating').findOne({user_id: new ObjectId(req.session.userid), party_id: new ObjectId(req.params.id) });
    const images = await database.collection('photos').find({ partyId: new ObjectId(req.params.id)}).map(photo => photo._id).toArray();
    
    // Counter total du nombre de like par nombre d'étoiles
    for (let i = 1; i < 6; i++){
        //Convertion en string sinon string et int pas les mêmes
        star = await database.collection('rating').countDocuments({party_id: new ObjectId(req.params.id), rate: i.toString()});
        vote_tot.push(star);
    }

    const comments = await database.collection('comments').find({ party_id: new ObjectId(req.params.id)}).toArray();
    comments_with_user = await Promise.all(comments.map( async (comment) => {
        const user = await database.collection('users').findOne({ _id: new ObjectId(comment.user_id) });
        return {
            ...comment,
            user: {
                fullname: user.fullname,
                _id: user._id
            }
        };
    }));
    const connected = req.session ? (req.session.userid == party.user_id) : false;

    res.render("party/party", {user:user, party: party, formattedDate: formattedDate, comments: comments_with_user, connected: connected, rating:rating, vote_tot, self_user_id: req.session.userid, images: images});
});

// ### RAID ###
router.get('/raid/:id', async function(req, res){
    const database = req.app.locals.db;

    const party = await database.collection('party').findOne({ _id: new ObjectId(req.params.id) });
    if (!party) {
        return res.status(404).json({ error: "Soirée non trouvée" });
    }
    const formattedDate = formatDate(party.date);
    const user = await database.collection('users').findOne({ _id: new ObjectId(party.user_id) });

    res.render("raid", {user:user, party: party});
});

// ### Affichage d'image uploadée ###
router.get('/uploadedImages/:id', async (req, res) => {
    res.redirect('/uploadedImages/' + req.params.id + '/500');
});
// ### Affichage d'icône uploadée au format icône (64x64) ###
router.get('/uploadedImages/:id/:size', async (req, res) => {
    const database = req.app.locals.db;
    const photo = await database.collection('photos').findOne({ _id: new ObjectId(req.params.id) });
    const size = parseInt(req.params.size);

    if (!photo) {
        return res.status(404).send('Image not found');
    }

    const originalPath = path.join(__dirname, '../uploads/', photo.filename);
    try {
        const buffer = await sharp(originalPath)
            .resize(size, size)
            .toFormat('png')
            .toBuffer();

        res.set('Content-Type', 'image/png');
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing image');
    }
});

module.exports = router;
