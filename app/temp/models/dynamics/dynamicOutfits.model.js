/**
 * Dynamic data for Outfits which is subject to change at any time.
 * Additional data:
 *      Leader Name = statics/staticPlayers.model.js
 **/

module.exports = (sequelize, Sequelize) => {
    const DynamicOutfits = sequelize.define('DynamicOutfits', {
        outfit_id: {
            type: Sequelize.BIGINT,
            primaryKey: true
        },
        outfit_tag: {
            type: Sequelize.STRING,
            allowNull: true
        },
        // Player ID reference
        outfit_leader: {
            type: Sequelize.BIGINT,
            allowNull: false
        }
    });

    return DynamicOutfits;
};
