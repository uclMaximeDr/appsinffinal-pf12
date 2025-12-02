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
        await database.createCollection('accidents');

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

    var cookie = null;

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

    it("Test delete account //NOT AVAILABLE YET", async () => {
        return true;
    });

    afterAll(async () => {
        // Supprimer la DB de test à la fin
        await database.dropDatabase();
        await client.close();
    });
});