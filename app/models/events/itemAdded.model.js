"character_id":"",
"context":"",
"event_name":"ItemAdded",
"item_count":"",
"item_id":"",
"timestamp":"",
"world_id":"",
"zone_id":""
module.exports = (sequelize, Sequelize) => {
    const ItemAdded = sequelize.define("itemAdded", {
      character_id: {
        type: Sequelize.STRING
      },
      event_name: {
        type: Sequelize.STRING
      },
      timestamp: {
        type: Sequelize.STRING
      }
    });
  
    return ItemAdded;
  };