const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const socketio = require('socket.io');
const https = require('https');
const http = require('http');
const cron = require('node-cron');

const { MongoClient } = require('mongodb');

const pageRenderer = require('./routes/pageRenderer');
const apiRouter = require('./routes/api');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Config Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `photo_${Date.now()}${ext}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
app.locals.upload = upload;

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false }));

// Views and template engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Layouts
app.use(expressLayouts);
app.set('view options', { layout:'layout.ejs' });

// Session management
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

// Database variable to be set in tests
let database;
let client;

function setDatabase(db) {
  database = db;
  app.locals.db = db;
}

// HTTPS server setup
let server;
if(process.env.NO_HTTPS === "1") {
    console.warn("Le HTTPS est désactivé. Utilisation du HTTP.");
    server = http.createServer(app);
} else {
    if(!fs.existsSync('./certs/cert.pem') || !fs.existsSync('./certs/key.pem')) {
        console.error("Certificats SSL non trouvés dans le dossier 'certs'. Veuillez les générer pour utiliser HTTPS.");
        process.exit(1);
    }
    server = https.createServer({
        key: fs.readFileSync('./certs/key.pem'),
        cert: fs.readFileSync('./certs/cert.pem')
    }, app);
}

// Socket.IO setup and https server creation
const io = new socketio.Server(server, {
    cors: {
        origin: '*',
    },
});
app.locals.io = io;

// Host the Socket.IO client script
app.get('/scripts/socket.io.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'node_modules', 'socket.io', 'client-dist', 'socket.io.js'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).render("404");
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: 'Internal Server Error' });
});

// Start the server
if (process.env.NODE_ENV !== "test") {
  (async () => {
    // Connection à la base de données
    console.log('Connection à la base de données...');
    if (!database) {
        const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017";
        client = new MongoClient(mongoUrl);
    }
    
    await client.connect();
    database = client.db(process.env.DB_NAME || "prod_db");
    app.locals.db = database;
    console.log('Connecté à la base de données.');
    
    // Démarrage du serveur
    server.listen(PORT, '0.0.0.0', async () => {
        console.log(`Example app listening on port ${PORT}`)

        // Fonction exécutée tous les jours à 19h00
        console.log('Configuration du cron job pour les raids...');
        cron.schedule('0 19 * * *', async () => {
            console.log('Vérification des raids à déclencher...');
            const partiesWithRaids = await database.collection('party').find({
                raid: true,                                    // Soirées avec raid activé
                date: new Date().toISOString().slice(0, 10)    // Soirées prévues pour aujourd'hui
            }).toArray();
            if (partiesWithRaids.length === 0) { return; }
            const randomIndex = Math.floor(Math.random() * partiesWithRaids.length); // Sélectionne une partie au hasard
            const selectedParty = partiesWithRaids[randomIndex];
            
            io.emit('raidEvent', { partyId: selectedParty._id }); // Envoie l'événement à tous les clients connectés
            console.log(`Raid event triggered for party ID: ${selectedParty._id}`);
        });
    });
  })();
}

module.exports = {app, setDatabase};