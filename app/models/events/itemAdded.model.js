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
        timestamp: {
            type: Sequelize.BIGINT
        },
        character_id: {
            type: Sequelize.BIGINT
        },
        // TODO: Determine data type
        context: {
            type: Sequelize.STRING
        },
        event_name: {
            type: Sequelize.STRING
        },
        // TODO: Determine data type
        item_count: {
            type: Sequelize.STRING
        },
        item_id: {
            type: Sequelize.INTEGER.UNSIGNED
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
