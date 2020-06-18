/**

 **/

module.exports = (sequelize, Sequelize) => {
    const AlertScore = sequelize.define("AlertScore", {
        alert_id: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        control_vs: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        control_nc: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        control_tr: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        control_cutoff: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        }
    });

    return AlertScore;
};
