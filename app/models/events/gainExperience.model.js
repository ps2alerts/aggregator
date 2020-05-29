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
            type: Sequelize.INTEGER
        },
        event_name: {
            type: Sequelize.STRING
        },
        experience_id: {
            type: Sequelize.INTEGER
        },
        loadout_id: {
            type: Sequelize.INTEGER
        },
        other_id: {
            type: Sequelize.INTEGER
        },
        timestamp: {
            type: Sequelize.BIGINT
        },
        world_id: {
            type: Sequelize.INTEGER
        },
        zone_id: {
            type: Sequelize.INTEGER
        },
    });
  
    return GainExperience;
  };
