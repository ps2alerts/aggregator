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
    const ItemAdded = sequelize.define("itemAdded", {
        character_id: {
            type: Sequelize.STRING
        },
        event_name: {
            type: Sequelize.STRING
        },
        skill_id: {
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
  
    return ItemAdded;
  };