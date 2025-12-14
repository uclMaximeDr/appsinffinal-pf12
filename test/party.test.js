process.env.NODE_ENV = "test";

// Dependencies
const request = require("supertest");
const { randomUUID } = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');

const { app, setDatabase } = require("../app");

describe("Profile test", () => {

    var cookie;
    var startCookie;

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

        // First load start page to set session cookie
        startCookie = (await request(app)
            .get("/")).header['set-cookie'];
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

    // pageRenderer test create party 
    it("Test add party .get", async () => {
        // Not connected
        await request(app)
            .get("/party/create")
            .set("Cookie", startCookie)
            .expect(302)
            .expect('Location','/user/login')
    })


    it("Test page party info", async () => {
        const partyId = (await database.collection('party').findOne())._id;
        const page_render = await request(app)
            .get(`/party/${partyId}`)
            .set('Cookie', startCookie)
            .expect(200)


        // Check if the page is correctly rendered with the party
        expect(page_render.text).toContain("testadd");
        expect(page_render.text).toContain("title");
        expect(page_render.text).toContain("description");
        expect(page_render.text).toContain("Votre avis nous intéresse !");
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