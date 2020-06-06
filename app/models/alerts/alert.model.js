/**

 **/

module.exports = (sequelize, Sequelize) => {
    const Alert = sequelize.define("Alert", {
        type: {
            type: Sequelize.SMALLINT.UNSIGNED
        },
        world: {
            type: Sequelize.TINYINT.UNSIGNED
        },
        start_time: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        end_time: {
            type: Sequelize.BIGINT.UNSIGNED
        },
        running: {
            type: Sequelize.BOOLEAN,
            defaultValue: 0
        }
    });

    return Alert;
};
