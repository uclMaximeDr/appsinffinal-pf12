const express = require('express');
const router = express.Router();

// Routes
router.post('/login', (req, res) => {
    res.send('Login route');
});

// 404 handler
router.use((req, res) => {
    res.status(404).send('404 Not Found');
});

module.exports = router;
