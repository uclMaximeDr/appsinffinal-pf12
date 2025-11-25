const express = require('express');
const router = express.Router();

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
router.get('/', (req, res) => {
    res.render("index");
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


module.exports = router;
