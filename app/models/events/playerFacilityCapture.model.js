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
        timestamp: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        character_id: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        event_name: {
            type: Sequelize.STRING
        },
        facility_id: {
            type: Sequelize.MEDIUMINT.UNSIGNED
        },
        outfit_id: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        world_id: {
            type: Sequelize.SMALLINT.UNSIGNED
        },
        zone_id: {
            type: Sequelize.MEDIUMINT.UNSIGNED
        },
    });
  
    return PlayerFacilityCapture;
  };
