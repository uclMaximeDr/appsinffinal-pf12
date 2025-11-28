const express = require('express');
const router = express.Router();
const multer = require('multer');
const { ObjectId } = require("mongodb");

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
router.post('/validate-captcha', function (req, res, next) {
    const parts = JSON.parse(req.body.parts);
    const correctParts = ['1-1', '2-2', '2-3', '1-3', '2-1'];
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


// ### CAMERA ###
router.post("/uploadPhoto", (req, res) => {
    const upload = req.app.locals.upload;
    const db = req.app.locals.db;
    const uploadSingle = upload.single("photo");

    uploadSingle(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json({ error: err.message });
        } else if (err) {
            return res.status(500).json({ error: "Erreur lors du téléchargement du fichier" });
        }

        if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });

        // On récupère l'utilisateur
        const email = req.session?.email;
        if (!email) return res.status(401).json({ error: "Utilisateur non connecté" });

        // Coordonnées GPS (optionnelles)
        let lat = req.body.lat ? parseFloat(req.body.lat) : null;
        let lng = req.body.lng ? parseFloat(req.body.lng) : null;
        const location = (lat !== null && lng !== null) ? { type: "Point", coordinates: [lng, lat] } : null;

        // On crée l'objet photo
        const photoDoc = {
            filename: req.file.filename,
            uploadedBy: email,
            uploadedAt: new Date(),
            location: location
        };

        try {
            await db.collection("photos").insertOne(photoDoc);
            res.json({ message: "Image enregistrée et ajoutée à la DB", photo: photoDoc });
        } catch (dbErr) {
            console.error(dbErr);
            res.status(500).json({ error: "Erreur lors de l'enregistrement en DB" });
        }
    });
});

module.exports = router;


// ### PARTY ###
router.post('/create', async function (req, res, next) {
    const database = req.app.locals.db;

    const {address, title, description} = req.body;

    if (req.session.email != null && !req.session.id_saved){
        await database.collection('party').insertOne({address, title, description, email: req.session.email });
        res.send({success : true, message : "Soirée crée !"});
    }
    else if (req.session.email != null && req.session.id_saved){
        await database.collection('party').updateOne({_id: new ObjectId(req.session.data_party._id), email: req.session.email},{$set: {address, title, description}});
        req.session.id_saved = null; 
        res.send({success : true,  message : "Soirée modifiée !"});
    }

    else{
        res.send({success : false, message : "Soirée non crée, pas de compte connecté."});
    }
})


router.post('/edit', async function (req, res, next) {
    const database = req.app.locals.db;
    const edit_id = req.body.edit_id;
    req.session.data_party = await database.collection('party').findOne({ _id: new ObjectId(edit_id) });
    req.session.id_saved = new ObjectId(edit_id);
    
    if (req.session.email != null && req.session.id_saved != null){
        res.send({success : true,  message : "Soirée modifiée !"});
    }
    else{
        res.send({success : false, message : "Soirée non modifiée, pas de compte connecté."});
    }
})

router.post('/delete', async function (req, res, next) {
    const database = req.app.locals.db;
    const delete_id = req.body.delete_id;

    if (req.session.email != null && delete_id != null){
        await database.collection('party').deleteOne({email: req.session.email, _id: new ObjectId(delete_id)});
        res.send({success : true, message : "Soirée supprimée !"});
    }
    else{
        res.send({success : false, message : "Soirée non supprimée, pas de compte connecté."});
    }
})

