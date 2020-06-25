/**

 **/

module.exports = (sequelize, Sequelize) => {
    const Alert = sequelize.define('Alert', {
        type: {
            type: Sequelize.INTEGER
        },
        world_id: {
            type: Sequelize.INTEGER
        },
        zone_id: {
            type: Sequelize.INTEGER
        },
        start_time: {
            type: Sequelize.BIGINT
        },
        end_time: {
            type: Sequelize.BIGINT
        },
        running: {
            type: Sequelize.BOOLEAN,
            defaultValue: 0
        }
    });

    return Alert;
};
