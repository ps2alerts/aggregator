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
        timestamp: {
            type: Sequelize.BIGINT
        },
        amount: {
            type: Sequelize.INTEGER
        },
        character_id: {
            type: Sequelize.BIGINT
        },
        experience_id: {
            type: Sequelize.INTEGER
        },
        loadout_id: {
            type: Sequelize.INTEGER
        },
        // TODO: Narrow this down
        other_id: {
            type: Sequelize.INTEGER.UNSIGNED
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
