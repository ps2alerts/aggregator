/**
 "character_id":"",
 "event_name":"PlayerLogin/PlayerLogout",
 "timestamp":"",
 "world_id":""
 */

module.exports = (sequelize, Sequelize) => {
    const PlayerLogin = sequelize.define("PlayerLogin", {
        character_id: {
            type: Sequelize.INTEGER
        },
        event_name: {
            type: Sequelize.STRING
        },
        timestamp: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        world_id: {
            type: Sequelize.INTEGER
        }
    });
  
    return PlayerLogin;
  };
