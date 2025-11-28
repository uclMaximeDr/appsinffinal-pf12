process.env.NODE_ENV = "test";

// Dependencies
const request = require("supertest");
const { randomUUID } = require('crypto');
const { MongoClient } = require('mongodb');

const api = require("../routes/api");
const { setDatabase } = require("../app");


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

    it("Test pass captcha", async () => {
        return true;
    });
    
    it("Test fail captcha", async () => {
        return true;
    });

    it("Test bypass captcha", async () => {
        // Should redirect to captcha if you try to change page without passing it
        
        return true;
    })

    afterAll(async () => {
        // Supprimer la DB de test à la fin
        await database.dropDatabase();
        await client.close();
    });
});