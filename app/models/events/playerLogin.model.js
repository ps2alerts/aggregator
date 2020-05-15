/**
 "character_id":"",
 "event_name":"PlayerLogin/PlayerLogout",
 "timestamp":"",
 "world_id":""
 */

module.exports = (sequelize, Sequelize) => {
    const PlayerLogin = sequelize.define("PLayerLogin", {
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
  
    return PlayerLogin;
  };
