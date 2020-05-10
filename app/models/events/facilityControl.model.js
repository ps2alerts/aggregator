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
            type: Sequelize.STRING
        },
        new_faction_id: {
            type: Sequelize.STRING
        },
        old_faction_id: {
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
  
    return FacilityControl;
  };