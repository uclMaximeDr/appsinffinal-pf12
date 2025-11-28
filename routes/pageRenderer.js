const express = require('express');
const router = express.Router();
const { ObjectId } = require("mongodb");

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
            userFullname: await database.collection('users').findOne({email : req.session.email})
        };
    }));
    res.render("index", {email: req.session.email, username: req.session.username, parties : partiesNames});
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
    
    if(req.session && req.session.email) {
        res.redirect("/user/profile/me");
        return;
    }

    res.render("user/login");
})

router.get('/user/profile/me', async (req, res) => {
    // Default function to get the profile page of the currently connected user

    const database = req.app.locals.db;
    const email = req.session?.email;

    if (!email) {
        return res.status(401).json({ error: "Utilisateur non connecté" });
    }

    const user = await database.collection('users').findOne({ email });
    if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.redirect(`/user/profile/${user._id}`);
})

router.get('/user/profile/:id', async (req, res) => {
    // Global function to get the profile page of an id

    const database = req.app.locals.db;
    const id = req.params.id;

    const user = await database.collection('users').findOne({ _id: new ObjectId(id) });
    if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // The currently connected user
    const connectedUser = await database.collection('users').findOne({ email: req.session.email });

    // Whether the page we send is our own profile or not
    const isOwnProfile = connectedUser._id.toString() == user._id.toString()

    // Whether we are friend with the user we want to visit
    const isFriend = connectedUser.friends.includes(parseInt(id));

    const parties = await database.collection('party').find({email : req.session.email}).toArray();
    const averageRating = parties.length > 0 ? (parties.reduce((sum, party) => sum + (party.rating || 0), 0) / parties.length).toFixed(1) : 0;

    res.render("user/profile", {
        username: user.fullname,
        rating : averageRating,
        parties : parties,
        isFriend : isFriend,
        isOwnProfile : isOwnProfile });
})

router.get('/user/edit', (req, res) => {

    if(!req.session || !req.session.email) {
        res.redirect("/user/login");
        return;
    }

    res.render("user/edit", { email: req.session.email, username: req.session.username });
});

// ### PARTY ###
router.get('/party/create', (req, res) => {
    res.render("party/create", {email: req.session.email, username: req.session.username, data_party : req.session.data_party, id_saved : req.session.id_saved});
});


//Affichage soirée de l'utilisateur
router.get('/party/myposts', async function(req, res){

    const database = req.app.locals.db;

    const parties = await database.collection('party').find({email : req.session.email}).toArray();
    
    res.render("party/myposts", {email: req.session.email, username: req.session.username, parties: parties,});
});


//Affichage information de la soirée
router.get('/party/:id', async function(req, res){
    const database = req.app.locals.db;
    const party = await database.collection('party').findOne({ _id: new ObjectId(req.params.id) });
    const connected = req.session ? (req.session.email == party.email) : false;
    //const userFullname = await getFullname(database, party.email);
    //dans res => fullname: await getFullname(database, req.session.email)

    res.render("party/party", { party: { ...party }, connected: connected });
});


module.exports = router;
