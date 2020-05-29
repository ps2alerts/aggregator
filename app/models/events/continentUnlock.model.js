/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
"event_name":"",
"timestamp":"",
"world_id":"",
"zone_id":"",
"triggering_faction":"",
"previous_faction":"",
"vs_population":"",
"nc_population":"",
"tr_population":"",
"metagame_event_id":"",
"event_type":""
 * ### END ###
 **/

module.exports = (sequelize, Sequelize) => {
    const ContinentUnlock = sequelize.define("ContinentUnlock", {
      event_name: {
        type: Sequelize.STRING
      },
      timestamp: {
        type: Sequelize.BIGINT
      },
      battle_rank: {
        type: Sequelize.STRING
      },
      world_id: {
        type: Sequelize.INTEGER
      },
      zone_id: {
        type: Sequelize.INTEGER
      },
      triggering_faction: {
        type: Sequelize.STRING
      },
      previous_faction: {
        type: Sequelize.STRING
      },
      vs_population: {
        type: Sequelize.STRING
      },
      nc_population: {
        type: Sequelize.STRING
      },
      tr_population: {
        type: Sequelize.STRING
      },
      metagame_event_id: {
        type: Sequelize.INTEGER
      },

      event_type: {
        type: Sequelize.STRING
      },
    });
  
    return ContinentUnlock;
  };
