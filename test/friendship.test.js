process.env.NODE_ENV = "test";

// Dependencies
const request = require("supertest");
const { randomUUID } = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');

const { app, setDatabase } = require("../app");
const { emit } = require("process");

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

        // Créer deux utilisateurs de test
        await request(app)
            .post("/api/register")
            .send({ fullname: "friend1", email: "friend1@gmail.com", password: "testPassword", confirmPassword : "testPassword" })
            .set("Content-Type", "application/json")
            .expect(200);

        await request(app)
            .post("/api/register")
            .send({ fullname: "friend2", email: "friend2@gmail.com", password: "testPassword", confirmPassword : "testPassword" })
            .set("Content-Type", "application/json")
            .expect(200);

        // Connecter les utilisateurs de test
        const friend1LoginResponse = await request(app)
            .post("/api/login")
            .set("Content-Type", "application/json")
            .send({ email: "friend1@gmail.com", password: "testPassword" })
    
        cookie1 = friend1LoginResponse.header['set-cookie'];

        const friend2LoginResponse = await request(app)
            .post("/api/login")
            .set("Content-Type", "application/json")
            .send({ email: "friend2@gmail.com", password: "testPassword" })
    
        cookie2 = friend2LoginResponse.header['set-cookie'];

        // First load start page to set session cookie
        startCookie = (await request(app)
            .get("/")).header['set-cookie'];

        const friend1 = await database.collection('users').findOne({ email: "friend1@gmail.com" })
        const friend2 = await database.collection('users').findOne({ email: "friend2@gmail.com" })

        friend1Id = friend1 ? friend1._id : 0
        friend2Id = friend2 ? friend2._id : 0
    });

    beforeEach( async () => {

        const friendShip = [friend1Id, friend2Id];
        friendShip.sort();

        //Remove friend
        await database.collection("friendship").deleteOne({ id_1: new ObjectId(friendShip[0]), id_2: new ObjectId(friendShip[1]) });

        //Remove requests
        await database.collection("friendRequest").deleteOne({ from_id: new ObjectId(friendShip[0]), to_id: new ObjectId(friendShip[1]) });
        await database.collection("friendRequest").deleteOne({ to_id: new ObjectId(friendShip[0]), from_id: new ObjectId(friendShip[1]) });
    })

    it("Test send request without being connected", async () => {

        await request(app)
            .post("/api/user/sendFriendRequest")
            .set("Content-Type", "application/json")
            .send({
                id: friend2Id
            })
            .expect(401);
    });

    it("Test send request", async () => {

        await request(app)
            .post("/api/user/sendFriendRequest")
            .set("Content-Type", "application/json")
            .send({
                id: friend2Id
            })
            .set("Cookie", cookie1)
            .expect(200);
    });

    it("Test cancel request", async () => {

        // Send request
        await request(app)
            .post("/api/user/sendFriendRequest")
            .set("Content-Type", "application/json")
            .send({
                id: friend2Id
            })
            .set("Cookie", cookie1)
            .expect(200);

        // Cancel request
        await request(app)
            .post("/api/user/removeFriend")
            .set("Content-Type", "application/json")
            .send({
                id: friend2Id
            })
            .set("Cookie", cookie1)
            .expect(200);
    })

    it("Test accept request without request", async () => {

        // Cancel request
        await request(app)
            .post("/api/user/addFriend")
            .set("Content-Type", "application/json")
            .send({
                id: friend1Id
            })
            .set("Cookie", cookie2)
            .expect((res) => {
                expect(res.body.success).toBe(false);
            });
    })

    it("Test accept request", async () => {

        // Send request
        await request(app)
            .post("/api/user/sendFriendRequest")
            .set("Content-Type", "application/json")
            .send({
                id: friend2Id
            })
            .set("Cookie", cookie1)
            .expect(200);

        // Cancel request
        await request(app)
            .post("/api/user/addFriend")
            .set("Content-Type", "application/json")
            .send({
                id: friend1Id
            })
            .set("Cookie", cookie2)
            .expect(200);
    })

    afterAll(async () => {
        // Supprimer la DB de test à la fin
        await database.dropDatabase();
        await client.close();
    });
    

});