const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');

const pageRenderer = require('./routes/pageRenderer');
const apiRouter = require('./routes/api');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Views and template engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(session({
    secret: process.env.SESSION_SECRET || 'a-default-secret',
    resave: false,
    saveUninitialized: true
}));

// Serve static files from "static" directory
app.use(express.static(path.join(__dirname, 'static')));

// Routes
app.use('/', pageRenderer);
app.use('/api', apiRouter);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});

module.exports = app;