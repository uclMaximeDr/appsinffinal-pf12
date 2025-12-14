process.env.NODE_ENV = "test";

// Dependencies
const request = require("supertest");
const { randomUUID } = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');

const { app, setDatabase } = require("../app");

describe("Profile test", () => {

    var cookie;

    beforeAll (async () => {
        // Créer une DB temporaire
        const testDbName = `test_db_${randomUUID()}`;
        client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
        await client.connect();
        database = client.db(testDbName);
        await database.createCollection('users');
        await database.createCollection('party');

        // Injecter la DB dans l'application
        setDatabase(database);

        // Créer un utilisateur de test
        await request(app)
            .post("/api/register")
            .send({ fullname: "testName", email: "test@gmail.com", password: "testPassword", confirmPassword : "testPassword" })
            .set("Content-Type", "application/json")
            .expect(200);

        // Connecter l'utilisateur de test
        const loginresponse = await request(app)
            .post("/api/login")
            .set("Content-Type", "application/json")
            .send({ email: "test@gmail.com", password: "testPassword" })
    
        cookie = loginresponse.header['set-cookie'];
    });
    
    it("Test add party without being logged in", async () => {
        await request(app)
            .post("/api/create")
            .set("Content-Type", "application/json")
            .send({
                address: "testadd",
                latitude: 0,
                longitude: 0,
                title: "title",
                description: "description",
                raid: "true"
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe("Soirée non crée, pas de compte connecté.")
            });
    });

    it("Test add party", async () => {
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
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(true);
                expect(res.body.message).toBe("Soirée crée !")
            });

        const parties = await database.collection('party').find({  address: "testadd" }).toArray();
        expect(parties.length).toBe(1);
    })

    it("Test edit party without being logged in", async () => {
        const partyId = (await database.collection('party').findOne())._id;
        await request(app)
            .post('/api/edit')
            .set("Content-Type", "application/json")
            .send({
                edit_id: partyId
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe("Soirée non modifiée, pas de compte connecté.")
            });
    });

    it("Test edit party", async () => {
        const partyId = (await database.collection('party').findOne())._id;
        await request(app)
            .post('/api/edit')
            .set('Cookie', cookie)
            .set("Content-Type", "application/json")
            .send({
                edit_id: partyId
            })

        await request(app)
            .post("/api/create")
            .set("Content-Type", "application/json")
            .set("Cookie", cookie)
            .send({
                address: "testedit",
                latitude: 0,
                longitude: 0,
                title: "title",
                description: "description",
                raid: "true"
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(true);
                expect(res.body.message).toBe("Soirée modifiée !")
            });

        const newAddress = (await database.collection('party').findOne()).address;
        expect(newAddress).toBe("testedit")
    });

    it("Test delete party without being logged in", async () => {
        const partyId = (await database.collection('party').findOne())._id;
        await request(app)
            .post('/api/delete')
            .set("Content-Type", "application/json")
            .send({
                delete_id: partyId
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe("Soirée non supprimée, pas de compte connecté.")
            });
    });

    it("Test delete party", async () => {
        const partyId = (await database.collection('party').findOne())._id;

        await request(app)
            .post('/api/delete')
            .set('Cookie', cookie)
            .set("Content-Type", "application/json")
            .send({
                delete_id: partyId
            })


        const parties = await database.collection('party').find().toArray();
        expect(parties.length).toBe(0);
    });

    afterAll(async () => {
        // Supprimer la DB de test à la fin
        await database.dropDatabase();
        await client.close();
    });
});