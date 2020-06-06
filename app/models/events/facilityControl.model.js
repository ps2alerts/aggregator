/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
"duration_held":"",
"event_name":"FacilityControl",
"facility_id":"",
"new_faction_id":"",
"old_faction_id":"",
"outfit_id":"",
"timestamp":"",
"world_id":"",
"zone_id":""
 * ### END ###
 **/

module.exports = (sequelize, Sequelize) => {
    const FacilityControl = sequelize.define("FacilityControl", {
        timestamp: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        duration_held: {
            type: Sequelize.INTEGER.UNSIGNED
        },
        event_name: {
            type: Sequelize.STRING
        },
        facility_id: {
            type: Sequelize.SMALLINT.UNSIGNED
        },
        new_faction_id: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        old_faction_id: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        outfit_id: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        world_id: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        zone_id: {
            type: Sequelize.TINYINT.UNSIGNED
        },
    });
  
    return FacilityControl;
  };
