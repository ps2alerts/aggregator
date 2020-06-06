/**

 **/

module.exports = (sequelize, Sequelize) => {
    const AlertScore = sequelize.define("AlertScore", {
        alert_id: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        control_vs: {
            type: Sequelize.TINYINT.UNSIGNED,
            defaultValue: 0
        },
        control_nc: {
            type: Sequelize.TINYINT.UNSIGNED,
            defaultValue: 0
        },
        control_tr: {
            type: Sequelize.TINYINT.UNSIGNED,
            defaultValue: 0
        },
        control_cutoff: {
            type: Sequelize.TINYINT.UNSIGNED,
            defaultValue: 0
        }
    });

    return AlertScore;
};
