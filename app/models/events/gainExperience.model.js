/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
"amount":"",
"character_id":"",
"event_name":"GainExperience",
"experience_id":"",
"loadout_id":"",
"other_id":"",
"timestamp":"",
"world_id":"",
"zone_id":""
 * ### END ###
 **/

module.exports = (sequelize, Sequelize) => {
    const GainExperience = sequelize.define("GainExperience", {
        amount: {
            type: Sequelize.STRING
        },
        character_id: {
            type: Sequelize.STRING
        },
        event_name: {
            type: Sequelize.STRING
        },
        experience_id: {
            type: Sequelize.STRING
        },
        loadout_id: {
            type: Sequelize.STRING
        },
        other_id: {
            type: Sequelize.STRING
        },
        timestamp: {
            type: Sequelize.STRING
        },
        world_id: {
            type: Sequelize.STRING
        },
        zone_i: {
            type: Sequelize.STRING
        },
    });
  
    return GainExperience;
  };