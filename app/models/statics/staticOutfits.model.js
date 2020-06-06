/**
 * Contains all of the data for outfits which cannot change, e.g. servers.
 *
 * @See:
 *      Outfit Tag: models/dynamics/dynamicOutfits.model.js
 **/

module.exports = (sequelize, Sequelize) => {
    const StaticOutfits = sequelize.define("StaticOutfits", {
        outfit_id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
        },
        // While the below property CAN change, it's very rare and requires customer services to do it, so it's reasonably static.
        // TODO: Handle the case where Outfit Name does actually change.
        outfit_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        // Outfit TAG can be changed at any time!
        outfit_server: {
            type: Sequelize.TINY,
            allowNull: false
        },
        outfit_faction: {
            type: Sequelize.TINY,
            allowNull: false
        }
    });

    return StaticOutfits;
};
