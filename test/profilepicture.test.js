process.env.NODE_ENV = "test";

// Dependencies
const request = require("supertest");
const { randomUUID } = require('crypto');
const { MongoClient } = require('mongodb');

const { app, setDatabase } = require("../app");

describe("Profile test", () => {

    const DUMMY_IMAGE_BYTES = Buffer.from("dummy image bytes"); // Contenu fictif pour l'image de profil
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
    });

    it("Get profile picture", async () => {
        await request(app)
            .get('/api/user/profile-picture/me')
            .set("Cookie", cookie)
            .set("Content-Type", "application/json")
            .expect(302)
            .expect('Location', `/api/user/profile-picture/${userId}`);
    });

    it("Get profile picture without auth", async () => {
        await request(app)
            .get('/api/user/profile-picture/me')
            .set("Content-Type", "application/json")
            .expect(401);
    });

    it("Get profile picture by id", async () => {
        await request(app)
            .get(`/api/user/profile-picture/${userId}`)
            .set("Content-Type", "application/json")
            .expect(200)
            .expect('Content-Type', /image\/png/);
    });

    it("Get profile picture by invalid id", async () => {
        await request(app)
            .get(`/api/user/profile-picture/000000000000000000000000`) // ObjectId invalide
            .set("Content-Type", "application/json")
            .expect(404);
    });

    it("Test upload profile picture", async () => {
        // Uploader une image de profil
        await request(app)
            .post('/api/user/edit')
            .set("Cookie", cookie)
            .attach("photo", DUMMY_IMAGE_BYTES, "avatar.png") // Utilisation d'un buffer pour simuler un fichier
            .expect(200)
            .expect(res => {
                expect(res.body.success).toBe(true);
            });
    });

    it("Get uploaded profile picture", async () => {
        await request(app)
            .get(`/api/user/profile-picture/${userId}`)
            .set("Content-Type", "application/json")
            .expect(200)
            .expect('Content-Type', /image\/png/)
            expect((res) => {
                res.body.equals(DUMMY_IMAGE_BYTES);  // Vérifier que le contenu de l'image est correct
            });
    });
    
    afterAll(async () => {
        // Supprimer la DB de test à la fin
        await database.dropDatabase();
        await client.close();
    });
});