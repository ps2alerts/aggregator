const db = require("../models");


function startAlert(alertType,world,startTime){
    //Create an alert
    const alert = {
        type: alertType,
        world: world,
        start_time: startTime,
        end_time: NULL,
        running: 1
    }
    // Insert a new record in DB
    db.Alerts.create(alert)
        .then(data => {
            //Insert a new record of starting scores

            //Insert a new record of starting data
        })
        .catch(err => {
            console.log(err);
        });
}

module.exports = {
    startAlert,
}