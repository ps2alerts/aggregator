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
            type: Sequelize.BIGINT.UNSIGNED
        },
        amount: {
            type: Sequelize.MEDIUMINT.UNSIGNED
        },
        character_id: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        event_name: {
            type: Sequelize.STRING
        },
        experience_id: {
            type: Sequelize.MEDIUMINT.UNSIGNED
        },
        loadout_id: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        // TODO: Narrow this down
        other_id: {
            type: Sequelize.INTEGER.UNSIGNED
        },
        world_id: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        zone_id: {
            type: Sequelize.TINYINT.UNSIGNED
        },
    });
  
    return GainExperience;
  };
