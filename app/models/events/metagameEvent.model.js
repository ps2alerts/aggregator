/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
"event_name":"MetagameEvent",
"experience_bonus":"",
"faction_nc":"",
"faction_tr":"",
"faction_vs":"",
"metagame_event_id":"",
"metagame_event_state":"",
"timestamp":"",
"world_id":"",
"zone_id":""
 * ### END ###
 **/

module.exports = (sequelize, Sequelize) => {
    const MetagameEvent = sequelize.define("MetagameEvent", {
        timestamp: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        event_name: {
            type: Sequelize.STRING
        },
        // TODO: Think this is an integer not a string.
        experience_bonus: {
            type: Sequelize.STRING
        },
        faction_nc: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        faction_tr: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        faction_vs: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        metagame_event_id: {
            type: Sequelize.SMALLINT.UNSIGNED
        },
        metagame_event_state: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        world_id: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        zone_id: {
            type: Sequelize.TINYINT.UNSIGNED
        }
    });
  
    return MetagameEvent;
  };
