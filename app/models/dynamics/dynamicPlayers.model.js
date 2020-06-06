/**
 * Dynamic data for Players which is subject to change at any time.
 * Additional data:
 *      Player Name, Server, Faction = statics/staticPlayers.model.js
 **/

module.exports = (sequelize, Sequelize) => {
    const DynamicPlayers = sequelize.define("DynamicPlayers", {
        player_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            primaryKey: true
        },
        player_outfit_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true
        },
        player_br: {
            type: Sequelize.TINYINT.UNSIGNED,
            allowNull: false
        },
        player_asp: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: 0
        },
        player_alerts_participated: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        player_last_seen: {
            type: Sequelize.DATE,
            allowNull: false
        }
    });

    return DynamicPlayers;
};
