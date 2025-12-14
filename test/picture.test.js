process.env.NODE_ENV = "test";

// Dependencies
const request = require("supertest");
const { randomUUID } = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');

const { app, setDatabase } = require("../app");

describe("Profile test", () => {

    // PNG 1x1 transparent pour les tests
    const DUMMY_IMAGE_BYTES = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==",
        "base64"
    );

    var cookie;
    var userId;

    beforeAll (async () => {
        // Créer une DB temporaire
        const testDbName = `test_db_${randomUUID()}`;
        client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
        await client.connect();
        database = client.db(testDbName);
        await database.createCollection('users');

        // Injecter la DB dans l'application
        setDatabase(database);

        // Créer un utilisateur de test
        await request(app)
                    .post("/api/register")
                    .send({ fullname: "testName", email: "test@gmail.com", password: "testPassword", confirmPassword : "testPassword" })
                    .set("Content-Type", "application/json")
                    .expect(200);
        userId = (await database.collection('users').findOne({ email: "test@gmail.com" }))._id.toString();

        // Connecter l'utilisateur de test
        const loginresponse = await request(app)
            .post("/api/login")
            .set("Content-Type", "application/json")
            .send({ email: "test@gmail.com", password: "testPassword" })
    
        cookie = loginresponse.header['set-cookie'];

        // Créer une soirée de test
        await request(app)
            .post("/api/create")
            .set("Content-Type", "application/json")
            .set("Cookie", cookie)
            .send({
                address: "testadd",
                latitude: 0,
                longitude: 0,
                title: "title",
                description: "description",
                raid: "true"
            })

        // Load start page to avoid redirects on first upload
        await request(app)
            .get("/")
            .set("Cookie", cookie)
            .expect(302);
    });

    it("test upload picture without being logged in", async () => {
        // Essayer d'uploader une image de profil sans être connecté
        await request(app)
            .post('/api/uploadPhoto')
            .attach("photo", DUMMY_IMAGE_BYTES, "photo.png") // Utilisation d'un buffer pour simuler un fichier
            .expect(401)
            .expect(res => {
                expect(res.body.error).toBe("Utilisateur non connecté");
            });
    });

    it("Test upload picture without metadatas", async () => {
        // Uploader une image de profil
        await request(app)
            .post('/api/uploadPhoto')
            .set("Cookie", cookie)
            .attach("photo", DUMMY_IMAGE_BYTES, "photo.png") // Utilisation d'un buffer pour simuler un fichier
            .expect(200)
            .expect(res => {
                expect(res.body.success).toBe(true);
            });
    });

    it("Test upload picture with metadatas", async () => {
        // Uploader une image de profil avec des métadonnées
        await request(app)
            .post('/api/uploadPhoto')
            .set("Cookie", cookie)
            .field("lat", "0")
            .field("lng", "0")
            .attach("photo", DUMMY_IMAGE_BYTES, "photo.png") // Utilisation d'un buffer pour simuler un fichier
            .expect(200)
            .expect(res => {
                expect(res.body.success).toBe(true);
            });
    });

    it("Get uploaded picture without size", async () => {
        const photoId = (await database.collection('photos').findOne())._id.toString();

        await request(app)
            .get(`/uploadedImages/${photoId}`)
            .set("Content-Type", "application/json")
            .set("Cookie", cookie)
            .expect(302)
            .expect('Location', `/uploadedImages/${photoId}/500`);
    });

    it("Get uploaded picture with size", async () => {
        const photoId = (await database.collection('photos').findOne())._id.toString();

        const response =  await request(app)
            .get(`/uploadedImages/${photoId}/64`)
            .set("Content-Type", "application/json")
            .set("Cookie", cookie)
            .expect(200)
            .expect('Content-Type', /image\/png/);

        expect(response.body).toBeInstanceOf(Buffer);
        expect(response.body.length).toBeGreaterThan(0); // Vérifier que le buffer n'est pas vide
    });
    
    afterAll(async () => {
        // Supprimer la DB de test à la fin
        await database.dropDatabase();
        await client.close();
    });
});