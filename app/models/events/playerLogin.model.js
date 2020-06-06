/**
 "character_id":"",
 "event_name":"PlayerLogin/PlayerLogout",
 "timestamp":"",
 "world_id":""
 */

module.exports = (sequelize, Sequelize) => {
    const PlayerLogin = sequelize.define("PlayerLogin", {
        timestamp: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        character_id: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        event_name: {
            type: Sequelize.STRING
        },
        world_id: {
            type: Sequelize.SMALLINT.UNSIGNED
        },
    });
  
    return PlayerLogin;
  };
