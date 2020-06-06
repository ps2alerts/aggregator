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
    const ContinentLock = sequelize.define("ContinentLock", {
        timestamp: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        event_name: {
            type: Sequelize.STRING
        },
        battle_rank: {
            type: Sequelize.TINYINT.UNSIGNED
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
        event_type: {
            type: Sequelize.SMALLINT.UNSIGNED
        },
    });

    return ContinentLock;
};
