/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "character_id":"",
 "event_name":"PlayerLogin/PlayerLogout",
 "timestamp":"",
 "world_id":""
 * ### END ###
 **/

module.exports = (sequelize, Sequelize) => {
    const PlayerLogout = sequelize.define("PlayerLogout", {
        timestamp: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        character_id: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        event_name: {
            type: Sequelize.STRING
        },
        world_id: {
            type: Sequelize.SMALLINT.UNSIGNED
        },
    });

    return PlayerLogout;
};
