/**

 **/

module.exports = (sequelize, Sequelize) => {
    const Alert = sequelize.define("Alert", {
        type: {
            type: Sequelize.SMALLINT.UNSIGNED
        },
        world_id: {
            type: Sequelize.SMALLINT.UNSIGNED
        },
        zone_id: {
            type: Sequelize.MEDIUMINT.UNSIGNED
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
