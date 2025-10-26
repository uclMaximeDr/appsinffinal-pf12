const express = require('express');
const router = express.Router();

// Routes
router.get('/', (req, res) => {
    res.render("index");
});

router.get('/user/login', (req, res) => {
    // Disabled while testing
    // if(req.session && req.session.email) res.redirect("/user/profile");

    res.render("user/login");
})

router.get('/user/profile', (req, res) => {
    // Disabled while testing
    // if(!req.session || !req.session.email) return res.redirect("/user/login");

    res.render("user/profile", { email: req.session.email });
})

// 404 handler
router.use((req, res) => {
    res.status(404).render("404");
});

module.exports = router;
