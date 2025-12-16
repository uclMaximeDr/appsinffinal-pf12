const { countWordOccurrences, computeTFIDF } = require("../utils.js");

describe("Search tests", () => {
    it("Test word occurrence count", async () => {
        const text = "hello world, hello universe. Hello everyone!";
        const word = "hello";
        const expectedCount = 3;

        const result = countWordOccurrences(text, word);
        expect(result).toBe(expectedCount);
    });

    it("Test TF-IDF calculation", async () => {
        const accidents = [
            {
                title: "A cat party",
                address: "the cat sat on the cat",
                description: "A lovely cat is here",
                userFullname: "Alice"
            },
            {
                title: "A dog event",
                address: "the dog sat on the log",
                description: "A friendly dog is there",
                userFullname: "Bob"
            }
        ];
        const searchTerm = ["cat", "dog"];

        // Simple TF-IDF calculation for testing purposes
        const tfidfScores = computeTFIDF(accidents, searchTerm);

        expect(tfidfScores.length).toBe(2);
        expect(tfidfScores[0].party.address).toBe("the cat sat on the cat");
        expect(tfidfScores[1].party.address).toBe("the dog sat on the log");
    });

    it("Test TF-IDF with user search", async () => {
        const accidents = [
            {
                title: "A charlie event",
                address: "some address",
                description: "some description",
                userFullname: "Charlie"
            },
            {
                title: "Another event",
                address: "another address",
                description: "another description",
                userFullname: "David"
            }
        ];
        const searchTerm = ["charlie"];

        const tfidfScores = computeTFIDF(accidents, searchTerm);

        expect(tfidfScores.length).toBe(1);
        expect(tfidfScores[0].party.userFullname).toBe("Charlie");
    });
});