const request = require("supertest");
const { formatDate } = require("../utils");

describe("Date test", () => {

    it("Test current date", async () => {
        const date = new Date();
        const formattedDate = formatDate(date);

        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        expect(regex.test(formattedDate)).toBe(true);
    })

    it("Test specific date", async () => {
        const date = new Date('2025-12-09T14:27:45');
        const formattedDate = formatDate(date);
        expect(formattedDate).toBe("09/12/2025");
    });
});