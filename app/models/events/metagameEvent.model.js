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
            type: Sequelize.BIGINT
        },
        event_name: {
            type: Sequelize.STRING
        },
        // TODO: Think this is an integer not a string.
        experience_bonus: {
            type: Sequelize.STRING
        },
        faction_nc: {
            type: Sequelize.INTEGER
        },
        faction_tr: {
            type: Sequelize.INTEGER
        },
        faction_vs: {
            type: Sequelize.INTEGER
        },
        metagame_event_id: {
            type: Sequelize.INTEGER
        },
        metagame_event_state: {
            type: Sequelize.INTEGER
        },
        world_id: {
            type: Sequelize.INTEGER
        },
        zone_id: {
            type: Sequelize.INTEGER
        },
    });
  
    return MetagameEvent;
  };
