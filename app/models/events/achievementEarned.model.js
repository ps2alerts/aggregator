/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 * "event_name":"", 
 * "character_id":"",
 * "timestamp":"",
 * "world_id":"",
 * "achievement_id":"",
 * "zone_id":""
 * ### END ###
**/
module.exports = (sequelize, Sequelize) => {
    const AchievementEarned = sequelize.define("AchievementEarned", {
      character_id: {
        type: Sequelize.STRING
      },
      event_name: {
        type: Sequelize.STRING
      },
      achievement_id: {
        type: Sequelize.STRING
      },
      world_id: {
        type: Sequelize.STRING
      },
      zone_id: {
        type: Sequelize.STRING
      },
      timestamp: {
        type: Sequelize.STRING
      },
    });
  
    return AchievementEarned;
  };