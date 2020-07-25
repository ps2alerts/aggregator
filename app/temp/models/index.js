//const dbConfig = require("../config/db.config.js");

const { Sequelize } = require('sequelize');
// const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
//   host: dbConfig.HOST,
//   dialect: dbConfig.dialect,
//   operatorsAliases: false,
//
//   pool: {
  //     max: dbConfig.pool.,
//     min: dbConfig.pool.min,
//     acquire: dbConfig.pool.acquire,
//     idle: dbConfig.pool.idle
//   }
// });
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

/**
 * EVENTS
 */
db.AchievementsEarned = require('./events/achievementEarned.model.js')(sequelize, Sequelize);
db.BattleRankUps = require('./events/battleRankUp.model.js')(sequelize, Sequelize);
db.ContinentLocks = require('./events/continentLock.model.js')(sequelize, Sequelize);
db.ContinentUnlocks = require('./events/continentUnlock.model.js')(sequelize, Sequelize);
db.Deaths = require('./events/death.model.js')(sequelize, Sequelize);
db.FacilityControls = require('./events/facilityControl.model')(sequelize, Sequelize);
db.GainExperiences = require('./events/gainExperience.model.js')(sequelize, Sequelize);
db.ItemsAdded = require('./events/itemAdded.model.js')(sequelize, Sequelize);
db.MetagameEvents = require('./events/metagameEvent.model.js')(sequelize, Sequelize);
db.PlayerFacilityCaptures = require('./events/playerFacilityCapture.model.js')(sequelize, Sequelize);
db.PlayerFacilityDefends = require('./events/playerFacilityDefend.model.js')(sequelize, Sequelize);
db.PlayerLogins = require('./events/playerLogin.model.js')(sequelize, Sequelize);
db.PlayerLogouts = require('./events/playerLogout.model.js')(sequelize, Sequelize);
db.SkillsAdded = require('./events/skillAdded.model.js')(sequelize, Sequelize);
db.VehiclesDestroyed = require('./events/vehicleDestroy.model.js')(sequelize, Sequelize);

/**
 * ALERTS
 */

db.Alerts = require('./alerts/alert.model.js')(sequelize,Sequelize);
db.AlertScores = require('./alerts/alertScore.model.js')(sequelize,Sequelize);
db.AlertDatas = require('./alerts/alertData.model.js')(sequelize,Sequelize);

/**
 * AGGREGATES
 */
db.AggregateAlertOutfits = require('./aggregates/aggregateAlertOutfits.model.js')(sequelize, Sequelize);
db.AggregateAlertPlayers = require('./aggregates/aggregateAlertPlayers.model.js')(sequelize, Sequelize);
db.AggregateGlobalPlayers = require('./aggregates/aggregateGlobalPlayers.model.js')(sequelize, Sequelize);
db.AggregateGlobalOutfits = require('./aggregates/aggregateGlobalOutfits.model.js')(sequelize, Sequelize);

/**
 * STATIC DATA
 */
db.StaticOutfits = require('./statics/staticOutfits.model')(sequelize, Sequelize);
db.StaticPlayers = require('./statics/staticPlayers.model')(sequelize, Sequelize);

/**
 * CHANGEABLE DYNAMIC DATA
 */
db.DynamicOutfits = require('./dynamics/dynamicOutfits.model.js')(sequelize, Sequelize);
db.DynamicPlayers = require('./dynamics/dynamicPlayers.model.js')(sequelize, Sequelize);

module.exports = db;
