/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
"character_id":"",
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
        event_name: {
            type: Sequelize.STRING
        },
        experience_bonus: {
            type: Sequelize.STRING
        },
        faction_nc: {
            type: Sequelize.STRING
        },
        faction_tr: {
            type: Sequelize.STRING
        },
        faction_vs: {
            type: Sequelize.STRING
        },
        metagame_event_id: {
            type: Sequelize.STRING
        },
        metagame_event_state: {
            type: Sequelize.STRING
        },
        timestamp: {
            type: Sequelize.STRING
        },
        world_id: {
            type: Sequelize.STRING
        },
        zone_id: {
            type: Sequelize.STRING
        }
    });
  
    return MetagameEvent;
  };