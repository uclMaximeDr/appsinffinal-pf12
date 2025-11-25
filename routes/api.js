const express = require('express');
const router = express.Router();
const { getDatabase } = require('../app');

// Routes

// ### LOGIN && REGISTER ###
router.post('/login', async function (req, res, next) {
    
    const database = req.app.locals.db;
    const { email, password } = req.body;

    const user = await database.collection('users').findOne({ email, password });
    if (user) {
        req.session.email = user.email;
        req.session.username = user.fullname;
        res.send({ success: true });
    } else {
        res.send({ success: false, message: "Nom d'utilisateur ou mot de passe incorrect." });
    }
});

router.post('/register', async function (req, res, next) {
     
    const database = req.app.locals.db;

    const {fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
        res.status(400).end();
        return;
    }

    const existingUser = await database.collection('users').findOne({ email });
    const isFirstUser = (await database.collection('users').countDocuments({})) === 0;

    if (!existingUser) {
        await database.collection('users').insertOne({ fullname, email, password, admin: isFirstUser });
        res.send({ success: true })
    }
    else {
        res.send({ success: false, message: "Couldn't create user."})
    }

})

router.post('/disconnect', async function (req, res, next) {
    
    console.log(req.session);

    if (req.session.email != null)
        {
            req.session.email = null;
            req.session.username = null;

            res.send({success: true})
        }
        else {
            res.send({success: false, message: "Couldn't disconnect!"})
        }

})


// ### CAPTCHA ###
router.post('/request-captcha', function (req, res, next) {
    if (req.session) {
        req.session.needCaptcha = true;
    }
    res.send({
        url: '/images/captcha.jpg'
    });
});

router.post('/validate-captcha', function (req, res, next) {
    const parts = JSON.parse(req.body.parts);
    const correctParts = ['1-1'];
    console.log(parts);
    
    let isValid = true;
    if(parts.length !== correctParts.length) isValid = false;
    for(const part of correctParts) {
        if(!parts.includes(part)) {
            isValid = false;
            break;
        }
    }

    if(req.session && isValid) {
        req.session.needCaptcha = false;
    }
    
    res.send({ success: isValid });
});

module.exports = router;
