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
            type: Sequelize.STRING
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
            type: Sequelize.STRING
        },
        timestamp: {
            type: Sequelize.STRING
        },
        world_id: {
            type: Sequelize.STRING
        },
        zone_id: {
            type: Sequelize.STRING
        },
    });
  
    return ItemAdded;
  };