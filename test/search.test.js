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

        // Ajouter 2 utilisateurs pour les tests
        await request(app)
        .post("/api/register")
        .send({ fullname: "testOne", email: "test1@gmail.com", password: "testPassword", confirmPassword : "testPassword" })
        .set("Content-Type", "application/json")
        .expect(200);

        await request(app)
        .post("/api/register")
        .send({ fullname: "testTwo", email: "test2@gmail.com", password: "testPassword", confirmPassword : "testPassword" })
        .set("Content-Type", "application/json")
        .expect(200);
    });
    
    it("Test search", async () => {
        await request(app)
        .get("/api/user/search?q=test")
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toBe(2);
            expect(res.body[0].fullname).toBe("testOne");
            expect(res.body[1].fullname).toBe("testTwo");
        });
    });

    it("Test search with no results", async () => {
        await request(app)
        .get("/api/user/search?q=nomatch")
        .expect(200)
        .expect((res) => {
            expect(res.body.length).toBe(0);
        });
    });

    afterAll(async () => {
        // Supprimer la DB de test à la fin
        await database.dropDatabase();
        await client.close();
    });
});