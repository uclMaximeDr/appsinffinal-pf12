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

    it("Test start page", async () => {
        const response = await request(app)
        .get("/")
        .expect(302)
        .expect('Location', '/start');
        
        const cookie = response.headers['set-cookie'];
    });

    it("Test bypass captcha", async () => {
        const response = await request(app)
        .get("/")
        .expect(302)
        .expect('Location', '/start');

        const cookie = response.headers['set-cookie'];
        
        await request(app)
        .get("/captcha")
        .set('Cookie', cookie)
        .expect(200);
        
        await request(app)
        .get("/")
        .set('Cookie', cookie)
        .expect(302)
        .expect('Location', '/captcha?next=%2F');

        return true;
    })

    afterAll(async () => {
        // Supprimer la DB de test à la fin
        await database.dropDatabase();
        await client.close();
    });
});