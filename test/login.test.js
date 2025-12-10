process.env.NODE_ENV = "test";

// Dependencies
const request = require("supertest");
const { randomUUID } = require('crypto');
const { MongoClient } = require('mongodb');

const { app, setDatabase } = require("../app");

describe("Profile test", () => {

    beforeAll (async () => {
        // Créer une DB temporaire
        const testDbName = `test_db_${randomUUID()}`;
        client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
        await client.connect();
        database = client.db(testDbName);
        await database.createCollection('users');

        // Injecter la DB dans l'application
        setDatabase(database);
    });
    
    it("Test register with missing infos", async () => {
        // Registering with missing infos
        // EXPECTED : code 400
        
        const infos = { email: "fail@gmail.com", password: "failPassword" }

        await request(app)
        .post("/api/register")
        .send(infos)
        .set("Content-Type", "application/json")
        .expect(400);
    })

    it("Test register", async () => {
        // Simple test for register
        // EXPECTED : code 302
        
        await request(app)
        .post("/api/register")
        .send({ fullname: "testName", email: "test@gmail.com", password: "testPassword", confirmPassword : "testPassword" })
        .set("Content-Type", "application/json")
        .expect(200);
    })

    it("Test register with existing email", async () => {
        // Registering with existing email
        // EXPECTED : code 400
        
        await request(app)
        .post("/api/register")
        .send({ fullname: "testName", email: "test@gmail.com", password: "testPassword", confirmPassword : "testPassword" })
        .set("Content-Type", "application/json")
        .expect(200)
        .expect((res) => {
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Un utilisateur avec cet email existe déjà.");
        });
    })

    var cookie = null;

    it("Test login with wrong password", async () => {
        // Login with wrong infos
        
        const infos = { email: "fail@gmail.com", password: "failPassword" }

        await request(app)
        .post("/api/login")
        .send(infos)
        .set("Content-Type", "application/json")
        .expect((res) => {
            expect(res.body.success).toBe(false);
        })
        .expect(200);
    })

    it("Test login", async () => {
        // Simple test for login
        // EXPECTED : code 302
        
        const response = await request(app)
        .post("/api/login")
        .send({ email: "test@gmail.com", password: "testPassword" })
        .set("Content-Type", "application/json")
        .expect(200);

        cookie = response.header['set-cookie'];
    })

    it("Test disconnect", async () => {

        await request(app)
        .post("/api/disconnect")
        .set("Cookie", cookie)
        .set("Content-Type", "application/json")
        .expect((res) => {
            if (!res.body.success) {
                
                throw new Error("Disconnect should succeed when session exists");
            }
        })
        .expect(200);

    });

    it("Test disconnect without session", async () => {

        await request(app)
        .post("/api/disconnect")
        .set("Content-Type", "application/json")
        .expect((res) => {
            expect(res.body.success).toBe(false);
        })
        .expect(200);

    });

    it("Test delete account without session", async () => {
        
        await request(app)
        .post("/api/user/delete")
        .set("Content-Type", "application/json")
        .expect(200);

        const userCount = await database.collection('users').countDocuments({ email: "test@gmail.com" });
        expect(userCount).toBe(1); // L'utilisateur ne doit pas être supprimé
    });

    it("Test delete account", async () => {

        // Re-login to have a valid session
        const response = await request(app)
        .post("/api/login")
        .send({ email: "test@gmail.com", password: "testPassword" })
        .set("Content-Type", "application/json")
        .expect(200);

        cookie = response.header['set-cookie'];
        
        await request(app)
        .post("/api/user/delete")
        .set("Cookie", cookie)
        .set("Content-Type", "application/json")
        .expect(200);

        const userCount = await database.collection('users').countDocuments({ email: "test@gmail.com" });
        expect(userCount).toBe(0); // L'utilisateur ne doit plus correspondre à l'email

        const totalUsers = await database.collection('users').countDocuments({});
        expect(totalUsers).toBe(1); // L'utilisateur est toujours dans la DB (mais plus accessible)

        const firstUser = await database.collection('users').findOne({});
        expect(firstUser.email).toBe(""); // L'email de l'utilisateur est vidé
        expect(firstUser.fullname).toBe("Utilisateur supprimé"); // Le nom de l'utilisateur est modifié
    });

    afterAll(async () => {
        // Supprimer la DB de test à la fin
        await database.dropDatabase();
        await client.close();
    });
});