function validate (payload) {
    if (payload.hasOwnProperty("zone_id")) {
        const zone_id = parseInt(payload.zone_id);
        // Perform checks for active alert zones and worlds
    }

    return true;
}

module.exports = {
    validate
};