/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
"character_id":"",
"context":"",
"event_name":"ItemAdded",
"item_count":"",
"item_id":"",
"timestamp":"",
"world_id":"",
"zone_id":""
 * ### END ###
 **/

module.exports = (sequelize, Sequelize) => {
    const ItemAdded = sequelize.define("ItemAdded", {
        character_id: {
            type: Sequelize.INTEGER
        },
        context: {
            type: Sequelize.STRING
        },
        event_name: {
            type: Sequelize.STRING
        },
        item_count: {
            type: Sequelize.STRING
        },
        item_id: {
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
  
    return ItemAdded;
  };
