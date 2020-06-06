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
        duration_held: {
            type: Sequelize.STRING
        },
        event_name: {
            type: Sequelize.STRING
        },
        facility_id: {
            type: Sequelize.INTEGER
        },
        new_faction_id: {
            type: Sequelize.INTEGER
        },
        old_faction_id: {
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
  
    return FacilityControl;
  };
