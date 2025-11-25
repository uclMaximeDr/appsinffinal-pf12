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

module.exports = router;
