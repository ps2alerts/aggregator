/**
 * Tallies up each outfits's statistics for rendering on a global alert basis.
 * @See:
 *      Outfit Name, Faction, Server = models/statics/staticOutfits.model.js
 *      Outfit Tag = models/dynamics/dynamicOutfits.model.js
 **/

module.exports = (sequelize, Sequelize) => {
    const AggregateGlobalOutfits = sequelize.define("AggregateGlobalOutfits", {
        outfit_id: {
            type: Sequelize.BIGINT,
            primaryKey: true
        },
        outfit_kills: {
            type: Sequelize.INT,
            defaultValue: 0
        },
        outfit_deaths: {
            type: Sequelize.INT,
            defaultValue: 0
        },
        outfit_team_kills: {
            type: Sequelize.INT,
            defaultValue: 0
        },
        outfit_suicides: {
            type: Sequelize.INT,
            defaultValue: 0
        },
        outfit_headshots: {
            type: Sequelize.INT,
            defaultValue: 0
        },
        outfit_captures: {
            type: Sequelize.INT,
            defaultValue: 0
        },
        outfit_defences: {
            type: Sequelize.INT,
            defaultValue: 0
        },
        outfit_alerts_participated: {
            type: Sequelize.INT,
            defaultValue: 0
        }
    });

    return AggregateGlobalOutfits;
};
