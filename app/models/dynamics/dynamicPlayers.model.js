/**
 * Dynamic data for Players which is subject to change at any time.
 * Additional data:
 *      Player Name, Server, Faction = statics/staticPlayers.model.js
 **/

module.exports = (sequelize, Sequelize) => {
    const DynamicPlayers = sequelize.define("DynamicPlayers", {
        player_id: {
            type: Sequelize.BIGINT,
            primaryKey: true
        },
        player_outfit_id: {
            type: Sequelize.BIGINT,
            allowNull: true
        },
        player_br: {
            type: Sequelize.int,
            allowNull: false
        },
        player_asp: {
            type: Sequelize.TINY,
            allowNull: false,
            defaultValue: 0
        },
        player_last_seen: {
            type: Sequelize.DATETIME,
            allowNull: false
        }
    });

    return DynamicPlayers;
};
