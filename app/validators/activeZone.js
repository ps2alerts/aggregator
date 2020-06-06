function validate (payload) {
    if (payload.hasOwnProperty("zone_id")) {
        const zone_id = parseInt(payload.zone_id);
        // Perform checks for active alert zones and worlds
        if (flags.LOGGING.VALIDATION_REJECTS) {
            console.log(`Got event from zone ${payload.zone_id}, which we don't monitor!`);
        }
    }

    return true;
}

module.exports = {
    validate
};