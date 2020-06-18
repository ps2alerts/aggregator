/**
 * Contains all of the data for players which cannot change, e.g. servers.
 **/

module.exports = (sequelize, Sequelize) => {
    const StaticPlayers = sequelize.define("StaticPlayers", {
        player_id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
        },
        // While the below property CAN change, it's very rare and requires customer services to do it, so it's reasonably static.
        // TODO: Handle the case where Player Name does actually change.
        player_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        // Players can transfer servers via character transfer tokens or CS intervention, but they cost money and is reasonably static.
        // TODO: Handle the case where Player Server does actually change.
        player_server: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        player_faction: {
            type: Sequelize.INTEGER,
            allowNull: false
        }
    });

    return StaticPlayers;
};
