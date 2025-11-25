const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');

const { MongoClient } = require('mongodb');

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

// 404 handler
app.use((req, res) => {
    res.status(404).render("404");
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: 'Internal Server Error' });
});

// Database variable to be set in tests
let database;
let client;

function setDatabase(db) {
  database = db;
}

// Start the server
if (process.env.NODE_ENV !== "test") {
  (async () => {
    if (!database) {
        const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017";
        client = new MongoClient(mongoUrl);
        await client.connect();
        database = client.db(process.env.DB_NAME || "prod_db");
        app.locals.db = database;
    }

    app.listen(PORT, '0.0.0.0', async () => {
        console.log(`Example app listening on port ${PORT}`)
        await client.connect();
    });
  })();
}

module.exports = {app, setDatabase};