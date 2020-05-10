/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
"character_id":"",
"event_name":"PlayerFacilityCapture",
"facility_id":"",
"outfit_id":"",
"timestamp":"",
"world_id":"",
"zone_id":""
 * ### END ###
 **/

module.exports = (sequelize, Sequelize) => {
    const PlayerFacilityCapture = sequelize.define("PlayerFacilityCapture", {
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
  
    return PlayerFacilityCapture;
  };