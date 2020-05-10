/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
"character_id":"",
"event_name":"PlayerFacilityDefend",
"facility_id":"",
"outfit_id":"",
"timestamp":"",
"world_id":"",
"zone_id":""
 * ### END ###
 **/

module.exports = (sequelize, Sequelize) => {
    const PlayerFacilityDefend = sequelize.define("PlayerFacilityDefend", {
        character_id: {
            type: Sequelize.STRING
        },
        event_name: {
            type: Sequelize.STRING
        },
        facility_id: {
            type: Sequelize.STRING
        },
        outfit_id: {
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
        },
    });
  
    return PlayerFacilityDefend;
  };