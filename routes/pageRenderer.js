const express = require('express');
const router = express.Router();
const { ObjectId } = require("mongodb");
const path = require('path');
const sharp = require('sharp');

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
        if (!req.originalUrl.endsWith('/party/create')) {
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
    const partiesNames = await Promise.all(parties.map(async party => {
        return {
            ...party,
            user: {
                fullname: (await database.collection('users').findOne({_id : new ObjectId(party.user_id)})).fullname
            },
            image: (await database.collection('photos').findOne({partyId : party._id}))?._id || null
        };
    }));
    res.render("index", {parties : partiesNames});
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
            images: await (database.collection('photos').find({partyId : new ObjectId(party._id)})).map(photo => photo._id).toArray()
        };
    }).toArray();
    const averageRating = parties.length > 0 ? (parties.reduce((sum, party) => sum + (party.rating || 0), 0) / parties.length).toFixed(1) : 0;

    // Infos about friendship with connected user
    
    
    const friendsList = new Array().concat(await database.collection('friendship').find({ id_2 : new ObjectId(user._id) }).toArray(),
                                        await database.collection('friendship').find({ id_1 : new ObjectId(user._id) }).toArray())

    
    const friends = friendsList.length;

    const friendShip = [req.session.userid, id]
    friendShip.sort();

    const isFriend = await database.collection('friendship').findOne({ id_1: new ObjectId(friendShip[0]), id_2: new ObjectId(friendShip[1]) }) != null;

    const isConnected = !!connectedUser;

    res.render("user/profile", {
        username: user.fullname,
        rating : averageRating,
        parties : parties,
        friends : friends,
        isFriend : isFriend,
        isOwnProfile : isOwnProfile,
        id: user._id,
        isConnected : isConnected
    });
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

    res.render("party/party", {user:user, party: party, comments: comments_with_user, connected: connected, rating:rating, vote_tot, self_user_id: req.session.userid, images: images});
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
