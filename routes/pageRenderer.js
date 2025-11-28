const express = require('express');
const router = express.Router();

// Check if first visit middleware
router.use((req, res, next) => {
    if(!req.session.visited) {
        req.session.visited = true;
        res.redirect('/start');
    } else {
        next();
    }
});

// Chech if need captcha middleware
router.use((req, res, next) => {
    if(req.originalUrl.startsWith('/captcha') || req.originalUrl.startsWith('/api/')) {
        next();
        return;
    }

    if(req.session && req.session.needCaptcha) {
        res.redirect(`/captcha?next=${encodeURIComponent(req.originalUrl)}`);
    } else {
        next();
    }
});

// Routes
router.get('/', async function(req, res){
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
        res.redirect("/user/profile");
        return;
    }

    res.render("user/login");
})

router.get('/user/profile', (req, res) => {

    if(!req.session || !req.session.email) {
        res.redirect("/user/login");
        return;
    }

    res.render("user/profile", { email: req.session.email, username: req.session.username, rating : 3.5 });
})

// ### PARTY ###
router.get('/party/create', (req, res) => {
    res.render("party/create", {email: req.session.email, username: req.session.username, data_party : req.session.data_party, id_saved : req.session.id_saved});
});

router.get('/party/myposts', async function(req, res){

    const database = req.app.locals.db;

    const parties = await database.collection('party').find({email : req.session.email}).toArray();
    
    res.render("party/myposts", {email: req.session.email, username: req.session.username, parties: parties});
});


module.exports = router;
