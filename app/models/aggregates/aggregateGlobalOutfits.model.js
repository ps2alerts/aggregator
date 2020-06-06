/**
 * Tallies up each outfits's statistics for rendering on a global alert basis.
 * @See:
 *      Outfit Name, Faction, Server = models/statics/staticOutfits.model.js
 *      Outfit Tag = models/dynamics/dynamicOutfits.model.js
 **/

module.exports = (sequelize, Sequelize) => {
    const AggregateGlobalOutfits = sequelize.define("AggregateGlobalOutfits", {
        outfit_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            primaryKey: true
        },
        outfit_kills: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        outfit_deaths: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        outfit_team_kills: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        outfit_suicides: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        outfit_headshots: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        outfit_captures: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        outfit_defences: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        outfit_alerts_participated: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        }
    });

    return AggregateGlobalOutfits;
};
