/**
 * Dynamic data for Outfits which is subject to change at any time.
 * Additional data:
 *      Leader Name = statics/staticPlayers.model.js
 **/

module.exports = (sequelize, Sequelize) => {
    const DynamicOutfits = sequelize.define("DynamicOutfits", {
        outfit_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            primaryKey: true
        },
        outfit_tag: {
            type: Sequelize.STRING,
            allowNull: true
        },
        // Player ID reference
        outfit_leader: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false
        }
    });

    return DynamicOutfits;
};
