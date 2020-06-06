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
            type: Sequelize.INTEGER
        },
        attacker_fire_mode_id: {
            type: Sequelize.INTEGER
        },
        attacker_loadout_id: {
            type: Sequelize.INTEGER
        },
        attacker_vehicle_id: {
            type: Sequelize.INTEGER
        },
        attacker_weapon_id: {
            type: Sequelize.INTEGER
        },
        character_id: {
            type: Sequelize.INTEGER
        },
        character_loadout_id: {
            type: Sequelize.INTEGER
        },
        event_name: {
            type: Sequelize.STRING
        },
        is_critical: {
            type: Sequelize.INTEGER
        },
        is_headshot: {
            type: Sequelize.INTEGER
        },
        timestamp: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        vehicle_id: {
            type: Sequelize.INTEGER
        },
        world_id: {
            type: Sequelize.INTEGER
        },
        zone_id: {
            type: Sequelize.INTEGER
        },
    });
  
    return Death;
  };
