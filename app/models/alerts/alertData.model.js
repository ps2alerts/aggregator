/**

 **/

module.exports = (sequelize, Sequelize) => {
    const AlertData = sequelize.define("AlertData", {
        alert_id: {
            type: Sequelize.INTEGER
        },
        kills_vs: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        kills_nc: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        kills_tr: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        deaths_vs: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        deaths_nc: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        deaths_tr: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        team_kills_vs: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        team_kills_nc: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        team_kills_tr: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        suicides_vs:{
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        suicides_nc:{
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        suicides_tr:{
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        total_kills: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        total_deaths: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        total_team_kills: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        total_suicides: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        total_headshots: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        }

    });

    return AlertData;
};
