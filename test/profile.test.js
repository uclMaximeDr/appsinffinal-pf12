process.env.NODE_ENV = "test";

// Dependencies
const request = require("supertest");
const { randomUUID } = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');

const { app, setDatabase } = require("../app");

describe("Profile test", () => {

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

        // Load start page to avoid redirects on first upload
        await request(app)
            .get("/")
            .set("Cookie", cookie)
            .expect(302);
    });

    it("Test get profile without authentication", async () => {
        const startCookie = (await request(app)
            .get("/")).header['set-cookie'];

        await request(app)
            .get('/user/profile/me')
            .set("Cookie", startCookie)
            .expect(302)
            .expect('Location', '/user/login');
    });

    it("Test get profile by id", async () => {
        await request(app)
            .get('/user/profile/' + userId)
            .set("Cookie", cookie)
            .expect(200);
    });

    it("Test get profile with authentication", async () => {
        await request(app)
            .get('/user/profile/me')
            .set("Cookie", cookie)
            .expect(302)
            .expect('Location', '/user/profile/' + userId);
    });

    it("Test get unexisting profile", async () => {
        await request(app)
            .get('/user/profile/000000000000000000000000')
            .set("Cookie", cookie)
            .expect(404);
    });

    it("Test edit profile without authentication", async () => {
        await request(app)
            .post('/api/user/edit')
            .send({ username: "newTestName", email: "new@test.com", password: "newTestPassword" })
            .set("Content-Type", "application/json")
            .expect((res) => {
                expect(res.body.success).toBe(true);
            })
            .expect(200);

        const updatedUser = await database.collection('users').findOne({ _id: new ObjectId(userId) });
        expect(updatedUser.fullname).toBe("testName"); // Ne doit pas être modifié
        expect(updatedUser.email).toBe("test@gmail.com"); // Ne doit pas être modifié
    });

    it("Test edit profile", async () => {
        // Uploader une image de profil
        await request(app)
            .post('/api/user/edit')
            .set("Cookie", cookie)
            .send({ username: "newTestName", email: "new@test.com", password: "newTestPassword" })
            .set("Content-Type", "application/json")
            .expect(200)
            .expect(res => {
                expect(res.body.success).toBe(true);
            });

        const updatedUser = await database.collection('users').findOne({ _id: new ObjectId(userId) });
        expect(updatedUser.fullname).toBe("newTestName"); // Doit être modifié
        expect(updatedUser.email).toBe("new@test.com"); // Doit être modifié
    });
    
    afterAll(async () => {
        // Supprimer la DB de test à la fin
        await database.dropDatabase();
        await client.close();
    });
});