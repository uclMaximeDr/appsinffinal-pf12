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
        await database.createCollection('comments');

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

        // Créer une fête de test
        await database.collection('party').insertOne({
            address: "initial",
            latitude: 0,
            longitude: 0,
            title: "title",
            description: "description",
            raid: true,
            creator_id: new ObjectId(1)
        });
    });
    
    it("Test create comment", async () => {
        await request(app)
            .post("/api/comment_create")
            .set("Content-Type", "application/json")
            .set("Cookie", cookie)
            .send({
                comment: "Hello world",
                party_id: 1
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.success).toBe(true);
                expect(res.body.message).toBe("Commentaire crée !")
            });

        const comments = await database.collection('comments').find({  comment: "Hello world" }).toArray();
        expect(comments.length).toBe(1);
    })

    it("Test delete comment", async () => {
        const commentId = (await database.collection('comments').findOne())._id;

        await request(app)
            .post('/api/comment_delete')
            .set('Cookie', cookie)
            .set("Content-Type", "application/json")
            .send({
                delcom_id: commentId
            })


        const comments = await database.collection('comments').find().toArray();
        expect(comments.length).toBe(0);
    });

    afterAll(async () => {
        // Supprimer la DB de test à la fin
        await database.dropDatabase();
        await client.close();
    });
});