/**

 **/

module.exports = (sequelize, Sequelize) => {
    const AlertScore = sequelize.define("AlertScore", {
        alert_id: {
            type: Sequelize.INTEGER
        },
        control_vs: {
            type: Sequelize.INTEGER
        },
        control_nc: {
            type: Sequelize.INTEGER
        },
        control_tr: {
            type: Sequelize.INTEGER
        },
        state: {
            type: Sequelize.INTEGER,
            defaultValue: "Init"
        }


    });

    return AlertScore;
};
