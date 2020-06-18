/**
 "character_id":"",
 "event_name":"PlayerLogin/PlayerLogout",
 "timestamp":"",
 "world_id":""
 */

module.exports = (sequelize, Sequelize) => {
    const PlayerLogin = sequelize.define("PlayerLogin", {
        timestamp: {
            type: Sequelize.BIGINT
        },
        character_id: {
            type: Sequelize.BIGINT
        },
        event_name: {
            type: Sequelize.STRING
        },
        world_id: {
            type: Sequelize.INTEGER
        },
    });
  
    return PlayerLogin;
  };
