/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
"attacker_character_id":"",
"attacker_fire_mode_id":"",
"attacker_loadout_id":"",
"attacker_vehicle_id":"",
"attacker_weapon_id":"",
"character_id":"",
"character_loadout_id":"",
"event_name":"Death",
"is_critical":"",
"is_headshot":"",
"timestamp":"",
"vehicle_id":"",
"world_id":"",
"zone_id":""
 * ### END ###
 **/

module.exports = (sequelize, Sequelize) => {
    const Death = sequelize.define("Death", {
        attacker_character_id: {
            type: Sequelize.String
        },
        attacker_fire_mode_id: {
            type: Sequelize.String
        },
        attacker_loadout_id: {
            type: Sequelize.String
        },
        attacker_vehicle_id: {
            type: Sequelize.String
        },
        attacker_weapon_id: {
            type: Sequelize.String
        },
        character_id: {
            type: Sequelize.String
        },
        character_loadout_id: {
            type: Sequelize.String
        },
        event_name: {
            type: Sequelize.String
        },
        is_critical: {
            type: Sequelize.String
        },
        is_headshot: {
            type: Sequelize.String
        },
        timestamp: {
            type: Sequelize.String
        },
        vehicle_id: {
            type: Sequelize.String
        },
        world_id: {
            type: Sequelize.String
        },
        zone_id: {
            type: Sequelize.String
        },
    });
  
    return Death;
  };