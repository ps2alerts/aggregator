/**
 * Tallies up each players's statistics for rendering on a global alert basis.
 * @See:
 *      Player Name, Faction, Server = models/statics/staticPlayers.model.js
 **/

module.exports = (sequelize, Sequelize) => {
    const AggregateGlobalPlayers = sequelize.define("AggregateGlobalPlayers", {
        player_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            primaryKey: true,
        },
        player_kills: {
            type: Sequelize.MEDIUMINT.UNSIGNED,
            defaultValue: 0
        },
        player_deaths: {
            type: Sequelize.MEDIUMINT.UNSIGNED,
            defaultValue: 0
        },
        player_team_kills: {
            type: Sequelize.MEDIUMINT.UNSIGNED,
            defaultValue: 0
        },
        player_suicides: {
            type: Sequelize.MEDIUMINT.UNSIGNED,
            defaultValue: 0
        },
        player_headshots: {
            type: Sequelize.MEDIUMINT.UNSIGNED,
            defaultValue: 0
        },
        player_alerts_participated: {
            type: Sequelize.MEDIUMINT.UNSIGNED,
            defaultValue: 0
        }
    });

    return AggregateGlobalPlayers;
};
