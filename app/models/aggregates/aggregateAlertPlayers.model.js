/**
 * Tallies up each player's statistics for rendering on a per-alert leaderboard.
 * @See
 *      Player Name, Faction, Server = models/statics/staticPlayers.model.js
 *      Outfit Name, Faction, Server = models/statics/staticOutfits.model.js
 *      Outfit Tag = models/dynamics/dynamicOutfits.model.js
 *
 * Outfit ID is included here so we know which player was with with outfit at the time of the alert. Their current
 * membership is located in models/dynamics/dynamicPlayers.model.js.
 **/

module.exports = (sequelize, Sequelize) => {
    const AggregateAlertPlayers = sequelize.define("AggregateAlertPlayers", {
        alert_id: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        player_id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
        },
        player_outfit_id: {
            type: Sequelize.BIGINT,
            allowNull: true
        },
        player_kills: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        player_deaths: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        player_team_kills: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        player_suicides: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        player_headshots: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        player_br: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        }
    });

    return AggregateAlertPlayers;
};
