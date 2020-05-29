/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
"character_id":"",
"event_name":"SkillAdded",
"skill_id":"",
"timestamp":"",
"world_id":"",
"zone_id":""
 * ### END ###
 **/

module.exports = (sequelize, Sequelize) => {
    const SkillAdded = sequelize.define("SkillAdded", {
        character_id: {
            type: Sequelize.INTEGER
        },
        event_name: {
            type: Sequelize.STRING
        },
        skill_id: {
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
  
    return SkillAdded;
  };
