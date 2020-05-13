/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
"attacker_character_id":"",
"attacker_fire_mode_id":"",
"attacker_loadout_id":"",
"attacker_vehicle_id":"",
"attacker_weapon_id":"",
"character_id":"",
"character_loadout_id":"",
"event_name":"VehicleDestroy",
"timestamp":"",
"vehicle_id":"",
"world_id":"",
"zone_id":""
 * ### END ###
 **/

module.exports = (sequelize, Sequelize) => {
    const VehicleDestroy = sequelize.define("VehicleDestroy", {
        attacker_character_id: {
            type: Sequelize.STRING
        },
        attacker_fire_mode_id: {
            type: Sequelize.STRING
        },
        attacker_loadout_id: {
            type: Sequelize.STRING
        },
        attacker_vehicle_id: {
            type: Sequelize.STRING
        },
        attacker_weapon_id: {
            type: Sequelize.STRING
        },
        character_id: {
            type: Sequelize.STRING
        },
        character_loadout_id: {
            type: Sequelize.STRING
        },
        event_name: {
            type: Sequelize.STRING
        },
        is_critical: {
            type: Sequelize.STRING
        },
        is_headshot: {
            type: Sequelize.STRING
        },
        timestamp: {
            type: Sequelize.STRING
        },
        vehicle_id: {
            type: Sequelize.STRING
        },
        world_id: {
            type: Sequelize.STRING
        },
        zone_id: {
            type: Sequelize.STRING
        },
    });
  
    return VehicleDestroy;
  };
