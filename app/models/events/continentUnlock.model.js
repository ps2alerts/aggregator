/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "event_name":"",
 "timestamp":"",
 "world_id":"",
 "zone_id":"",
 "triggering_faction":"",
 "previous_faction":"",
 "vs_population":"",
 "nc_population":"",
 "tr_population":"",
 "metagame_event_id":"",
 "event_type":""
 * ### END ###
 **/

module.exports = (sequelize, Sequelize) => {
    const ContinentUnlock = sequelize.define("ContinentUnlock", {
        timestamp: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        event_name: {
            type: Sequelize.STRING
        },
        world_id: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        zone_id: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        triggering_faction: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        previous_faction: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        vs_population: {
            type: Sequelize.SMALLINT.UNSIGNED
        },
        nc_population: {
            type: Sequelize.SMALLINT.UNSIGNED
        },
        tr_population: {
            type: Sequelize.SMALLINT.UNSIGNED
        },
        metagame_event_id: {
            type: Sequelize.SMALLINT.UNSIGNED
        },
        // TODO: Pretty sure this is an integer
        event_type: {
            type: Sequelize.STRING
        },
    });

    return ContinentUnlock;
};
