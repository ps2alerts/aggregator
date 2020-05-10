/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
"character_id":"",
"event_name":"PlayerLogin/PlayerLogout",
"timestamp":"",
"world_id":""
 * ### END ###
 **/

module.exports = (sequelize, Sequelize) => {
    const PlayerLogout = sequelize.define("PlayerLogout", {
      character_id: {
        type: Sequelize.STRING
      },
      event_name: {
        type: Sequelize.STRING
      },
      timestamp: {
        type: Sequelize.STRING
      },
      world_id: {
        type: Sequelize.STRING
      }
    });
  
    return PlayerLogout;
  };