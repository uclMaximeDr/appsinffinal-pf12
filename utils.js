const { ObjectId } = require("mongodb");
const { bool } = require("sharp");

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

module.exports = {
    formatDate,
    isFriend,
    hasSentRequest
};