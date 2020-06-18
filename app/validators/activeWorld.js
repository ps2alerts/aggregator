const features = require('../lib/config/features');

function validate (payload) {
    if (payload.hasOwnProperty("world_id")) {
        const world_id = parseInt(payload.world_id);
        if (!features.MONITORED_SERVERS.includes(world_id)) {
            if (features.LOGGING.VALIDATION_REJECTS) {
                console.log(`Got event from world ${payload.world_id}, which we don't monitor!`);
            }
            return false;
        }

        // TODO: Perform checks for active alert worlds
    }

    return true;
}

module.exports = {
    validate
}
