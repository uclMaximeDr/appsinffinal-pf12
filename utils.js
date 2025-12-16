const { ObjectId } = require("mongodb");

function formatDate(date) {
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // +1 car 0 = janvier
    const year = date.getUTCFullYear();

    const formatted = `${day}/${month}/${year}`;
    return formatted;
}

async function isFriend(db, id_1, id_2) {

    const friendShip = [id_1, id_2];
    friendShip.sort();

    const friendStatus = (await db.collection('friendship').findOne({ id_1: new ObjectId(friendShip[0]), id_2: new ObjectId(friendShip[1]) })) != null;

    return friendStatus;
}

async function hasSentRequest(db, id_1, id_2) {

    return await db.collection("friendRequest").findOne({ from_id: new ObjectId(id_1), to_id: new ObjectId(id_2) }) != null
                || await db.collection("friendRequest").findOne({ from_id: new ObjectId(id_2), to_id: new ObjectId(id_1) }) != null;

}

function computeTFIDF(parties, terms) {
    const scores = parties.map(party => {
        let score = 0;
        const titleLower = party.title.toLowerCase();
        const addressLower = party.address.toLowerCase();
        const descriptionLower = party.description.toLowerCase();
        const totalWordsTitle = titleLower.split(' ').length;
        const totalWordsAddress = addressLower.split(' ').length;
        const totalWordsDescription = descriptionLower.split(' ').length;

        terms.forEach(term => {
            const occurrencesTitle = countWordOccurrences(titleLower, term);
            const occurrencesAddress = countWordOccurrences(addressLower, term);
            const occurrencesDescription = countWordOccurrences(descriptionLower, term);

            const docsWithWord = parties.reduce((cnt, p) => {
                const lowerTerm = term.toLowerCase();
                const title = (p.title || "").toLowerCase();
                const addr = (p.address || "").toLowerCase();
                const desc = (p.description || "").toLowerCase();
                return cnt + ((title.includes(lowerTerm) || addr.includes(lowerTerm) || desc.includes(lowerTerm)) ? 1 : 0);
            }, 0);

            const idf = Math.log((parties.length) / (1 + docsWithWord)) + 1;

            const tfTitle = totalWordsTitle ? (occurrencesTitle / totalWordsTitle) : 0;
            const tfAddress = totalWordsAddress ? (occurrencesAddress / totalWordsAddress) : 0;
            const tfDescription = totalWordsDescription ? (occurrencesDescription / totalWordsDescription) : 0;

            score += (tfTitle + tfAddress + tfDescription) * idf;

            if (party.userFullname.toLowerCase().includes(term)) {
                score += 1;
            }
        });

        const logScore = Math.log(score + 1);

        return { party, score: logScore };
    });

    const sortedScores = scores
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

    return sortedScores;
}

function countWordOccurrences(text, word) {
    return text.toLowerCase().split(' ').filter(w => w.includes(word.toLowerCase())).length;
}

module.exports = {
    formatDate,
    isFriend,
    hasSentRequest,
    computeTFIDF,
    countWordOccurrences
};