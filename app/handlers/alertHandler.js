const db = require("../models");

function handleAlertEvent(event) {
    //if new alert event
    startAlert(event);
}

function startAlert(event){
    //Create an alert
    const alert = {
        type: event.metagame_event_id,
        world: event.world_id,
        zone: event.zone_id,
        start_time: event.timestamp,
        end_time: NULL,
        running: 1
    }
    // Insert a new record in DB
    db.Alerts.create(alert)
        .then(data => {
            const alertData = {
                alert_id: alert.alert_id
            }
            db.AlertDatas.create(alertData)
            db.AlertScores.create(alertData)
        })
        .catch(err => {
            console.log(err);
        });
}

function endAlert(){

}

function calculateAlertData(){

}

function calculateAlertScores(){

}

module.exports = {
    startAlert,
    handleAlertEvent
}