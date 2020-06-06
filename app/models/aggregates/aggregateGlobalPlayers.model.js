/**
 * Tallies up each players's statistics for rendering on a global alert basis.
 * @See:
 *      Player Name, Faction, Server = models/statics/staticPlayers.model.js
 **/

module.exports = (sequelize, Sequelize) => {
    const AggregateGlobalPlayers = sequelize.define("AggregateGlobalPlayers", {
        player_id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
        },
        player_kills: {
            type: Sequelize.INT,
            defaultValue: 0
        },
        player_deaths: {
            type: Sequelize.INT,
            defaultValue: 0
        },
        player_team_kills: {
            type: Sequelize.INT,
            defaultValue: 0
        },
        player_suicides: {
            type: Sequelize.INT,
            defaultValue: 0
        },
        player_headshots: {
            type: Sequelize.INT,
            defaultValue: 0
        },
        player_br: {
            type: Sequelize.INT,
            defaultValue: 0
        },
        player_alerts_participated: {
            type: Sequelize.INT,
            defaultValue: 0
        }
    });

    return AggregateGlobalPlayers;
};
