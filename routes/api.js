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

// ### USER INFO ###
router.get('/user/profile-picture/me', async function (req, res, next) {
    const database = req.app.locals.db;
    const email = req.session?.email;

    if (!email) {
        return res.status(401).json({ error: "Utilisateur non connecté" });
    }

    const user = await database.collection('users').findOne({ email });
    if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.redirect(`/api/user/profile-picture/${user._id}`);
});

router.get('/user/profile-picture/:id', async function (req, res, next) {
    const database = req.app.locals.db;
    const id = req.params.id;

    const user = await database.collection('users').findOne({ _id: new ObjectId(id) });
    if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const filename = user.profilePicture;
    if (!filename) {
        return res.sendFile("static/images/default-profile.png", { root: '.' });
    }

    res.sendFile(`uploads/${filename}`, { root: '.' })
});

router.post('/user/edit', async function (req, res, next) {
    const database = req.app.locals.db;
    const upload = req.app.locals.upload;
    
    uploadImage(req, res, "profilePicture").then(async (filename) => {
        const { username, email, password } = req.body;
        const updateData = {};
        if (username) updateData.fullname = username;
        if (email) updateData.email = email;
        if (password) updateData.password = password;

        await database.collection('users').updateOne(
            { email: req.session.email },
            { $set: updateData }
        );
        
        // Met à jour la session si l'email ou le nom d'utilisateur a changé
        if (email) req.session.email = email;
        if (username) req.session.username = username;
        res.send({ success: true });

    }).catch((error) => {
        console.error('Erreur lors de la mise à jour du profil :', error);
        res.status(500).send({ success: false, message: "Erreur lors de la mise à jour du profil." });
    });
});

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
    uploadImage(req, res, 'photoUpload')
        .then(async (filename) => {
            res.send({ success: true, filename: filename });
        })
        .catch((error) => {
            console.error("Erreur lors du téléchargement de l'image :", error);
            res.status(500).send({ success: false, message: "Erreur lors du téléchargement de l'image." });
        });
});

// ### PARTY ###

// Création soirée
router.post('/create', async function (req, res, next) {
    const database = req.app.locals.db;

    const {address, title, description} = req.body;

    // Soumettre nouvelle soirée
    if (req.session.email != null && !req.session.id_saved){
        await database.collection('party').insertOne({address, title, description, email: req.session.email });
        res.send({success : true, message : "Soirée crée !"});
    }
    // Modifier soirée avec même identifiant
    else if (req.session.email != null && req.session.id_saved){
        await database.collection('party').updateOne({_id: new ObjectId(req.session.data_party._id), email: req.session.email},{$set: {address, title, description}});
        req.session.id_saved = null; 
        res.send({success : true,  message : "Soirée modifiée !"});
    }
    // Refus
    else{
        res.send({success : false, message : "Soirée non crée, pas de compte connecté."});
    }
})

// Modification soirée
router.post('/edit', async function (req, res, next) {
    const database = req.app.locals.db;
    const edit_id = req.body.edit_id;
    req.session.data_party = await database.collection('party').findOne({ _id: new ObjectId(edit_id) });
    req.session.id_saved = new ObjectId(edit_id);

    // Vérification si identifiant reçu
    if (req.session.email != null && req.session.id_saved != null){
        res.send({success : true,  message : "Soirée modifiée !"});
    }
    else{
        res.send({success : false, message : "Soirée non modifiée, pas de compte connecté."});
    }
})

// Suppression soirée
router.post('/delete', async function (req, res, next) {
    const database = req.app.locals.db;
    const delete_id = req.body.delete_id;
    
    // Vérification si identifiant reçu
    if (req.session.email != null && delete_id != null){
        await database.collection('party').deleteOne({email: req.session.email, _id: new ObjectId(delete_id)});
        res.send({success : true, message : "Soirée supprimée !"});
    }
    else{
        res.send({success : false, message : "Soirée non supprimée, pas de compte connecté."});
    }
})

// ### UTILS ###
function uploadImage(req, res, context) {
    return new Promise((resolve, reject) => {
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

            if(context === 'profilePicture') {
                // On met à jour la photo de profil de l'utilisateur
                await db.collection("users").updateOne(
                    { email: email },
                    { $set: { profilePicture: req.file.filename } }
                );
            } else if(context === 'photoUpload') {
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
    
                // On insère la photo dans la collection
                await db.collection("photos").insertOne(photoDoc);
            }

            resolve(req.file.filename);
        });
    });
}

module.exports = router;