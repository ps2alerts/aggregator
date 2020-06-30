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
    const ContinentLock = sequelize.define('ContinentLock', {
        timestamp: {
            type: Sequelize.BIGINT
        },
        event_name: {
            type: Sequelize.STRING
        },
        battle_rank: {
            type: Sequelize.INTEGER
        },
        world_id: {
            type: Sequelize.INTEGER
        },
        zone_id: {
            type: Sequelize.INTEGER
        },
        triggering_faction: {
            type: Sequelize.INTEGER
        },
        previous_faction: {
            type: Sequelize.INTEGER
        },
        vs_population: {
            type: Sequelize.INTEGER
        },
        nc_population: {
            type: Sequelize.INTEGER
        },
        tr_population: {
            type: Sequelize.INTEGER
        },
        metagame_event_id: {
            type: Sequelize.INTEGER
        },
        event_type: {
            type: Sequelize.INTEGER
        },
    });

    return ContinentLock;
};
