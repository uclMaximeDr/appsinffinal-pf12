function formatDate(date) {
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // +1 car 0 = janvier
    const year = date.getUTCFullYear();

    const formatted = `${day}/${month}/${year}`;
    return formatted;
}

module.exports = {
    formatDate
};