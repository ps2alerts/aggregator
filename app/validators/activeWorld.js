const flags = require('../config/flags.js');

function validate (payload) {
    if (payload.hasOwnProperty("world_id")) {
        const world_id = parseInt(payload.world_id);
        if (!flags.MONITORED_SERVERS.includes(world_id)) {
            console.log(`Got event from world ${payload.world_id}, which we don't monitor!`);
            return false;
        }

        // TODO: Perform checks for active alert worlds
    }

    return true;
}

module.exports = {
    validate
}