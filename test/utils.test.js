process.env.NODE_ENV = "test";

// Dependencies
const request = require("supertest");
const { randomUUID } = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');

const { app, setDatabase } = require("../app");
const utils = require("../utils");

describe("Utils test", () => {
    let user1Id;
    let user2Id;
    let friendShip;

    beforeAll (async ()=>{
        // Créer une DB temporaire
        const testDbName = `test_db_${randomUUID()}`;
        client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
        await client.connect();
        database = client.db(testDbName);
        await database.createCollection('users');
        await database.createCollection('friendship');
        await database.collection("friendRequest");

        // Injecter la DB dans l'application
        setDatabase(database);

        // Créer un utilisateur de test
        await request(app)
            .post("/api/register")
            .send({ fullname: "testName1", email: "test1@gmail.com", password: "test1Password", confirmPassword : "test1Password" })
            .set("Content-Type", "application/json")
            .expect(200);

        // Créer un utilisateur de test
        await request(app)
            .post("/api/register")
            .send({ fullname: "testName2", email: "test2@gmail.com", password: "test2Password", confirmPassword : "test2Password" })
            .set("Content-Type", "application/json")
            .expect(200);

        user1Id = await database.collection("users").findOne({email : "test1@gmail.com"});
        user2Id = await database.collection("users").findOne({email : "test2@gmail.com"});
    });


    it("Test isNotFriend", async () => {

    const notFriends = await utils.isFriend(database, user1Id._id, user2Id._id);
    expect(notFriends).toBe(false);

    })

    it("Test isFriend", async () => {

    await database.collection("friendship").insertOne({ id_1: user1Id._id, id_2: user2Id._id});

    const areFriends = await utils.isFriend(database, user1Id._id, user2Id._id);
    expect(areFriends).toBe(true);

    })


    it("Test hasNotSentRequest", async () => {

    const hsnr = await utils.hasSentRequest(database, user1Id._id, user2Id._id);
    expect(hsnr).toBe(false);

    })

    it("Test hasSentRequest", async () => {

    await database.collection("friendRequest").insertOne({ from_id: user1Id._id, to_id: user2Id._id});

    const hsr = await utils.hasSentRequest(database, user1Id._id, user2Id._id);
    expect(hsr).toBe(true);

    })
    afterAll(async () => {
        // Supprimer la DB de test à la fin
        await database.dropDatabase();
        await client.close();
    });

});