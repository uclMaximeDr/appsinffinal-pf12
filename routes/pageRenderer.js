const express = require('express');
const router = express.Router();

// Routes
router.get('/', (req, res) => {
    res.render("index");
});

router.get('/camera', (req, res) => {
    res.render("camera");
});

router.get('/captcha', (req, res) => {
    res.render("captcha");
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

    res.render("user/profile", { email: req.session.email });
})


module.exports = router;
