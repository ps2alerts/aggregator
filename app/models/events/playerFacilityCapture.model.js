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
            type: Sequelize.INTEGER
        },
        event_name: {
            type: Sequelize.STRING
        },
        facility_id: {
            type: Sequelize.INTEGER
        },
        outfit_id: {
            type: Sequelize.INTEGER
        },
        timestamp: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        world_id: {
            type: Sequelize.INTEGER
        },
        zone_id: {
            type: Sequelize.INTEGER
        },
    });
  
    return PlayerFacilityCapture;
  };
