/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
"battle_rank":"",
"character_id":"",
"event_name":"BattleRankUp",
"timestamp":"",
"world_id":"",
"zone_id":""
 * ### END ###
 **/

module.exports = (sequelize, Sequelize) => {
    const BattleRankUp = sequelize.define("BattleRankUp", {
        timestamp: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        character_id: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        event_name: {
            type: Sequelize.STRING
        },
        battle_rank: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        world_id: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        zone_id: {
            type: Sequelize.TINYINT.UNSIGNED
        }
    });
  
    return BattleRankUp;
  };
