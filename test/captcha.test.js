process.env.NODE_ENV = "test";

// Dependencies
const request = require("supertest");
const { app } = require("../app");


describe("Profile test", () => {

    it("Test start page", async () => {
        await request(app)
        .get("/")
        .expect(302)
        .expect('Location', '/start');
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
});