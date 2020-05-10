const api_key = require('./api_key.js');
const WebSocket = require('ws');
const db = require("../models");


function createStream() {
    const ws = new WebSocket('wss://push.planetside2.com/streaming?environment=ps2&service-id=s:' + api_key.KEY);
    ws.on('open', function open() {
        console.log('Connected to Census Api');
        subscribe(ws);
    });
    ws.on('message', function incoming(data) {
        handleWsResponse(data);

    });
}

function subscribe(ws) {
    console.log('Subscribing to DBG websocket..');

    ws.send('{"service":"event","action":"subscribe","characters":["all"],"eventNames":["all"],"worlds":["all"],"logicalAndCharactersWithWorlds":true}');
    console.log('Subscribed to all events for all servers');
}

function handleWsResponse(raw) {
    //console.log(raw);

    jsonData = JSON.parse(raw);
    //console.log(jsonData);
    if (jsonData.hasOwnProperty('payload')) {
        //define here
        var payload = jsonData.payload;
        switch (payload.event_name) {
        case 'AchievementEarned':
            break;
        case 'BattleRankUp':
            break;
        case 'Death':
            break;
        case 'FacilityControl':
            break;
        case 'GainExperience':
            break;
        case 'ItemAdded':
            break;
        case 'MetagameEvent':
            break;
        case 'PlayerFacilityCapture':
            break;
        case 'PlayerFacilityDefend':
            break;
        case 'PlayerLogin':
            console.log(payload);
            storeLogin(payload.character_id,payload.event_name,payload.timestamp);
            break;
        case 'PlayerLogout':
            console.log(payload);
            storeLogin(payload.character_id,payload.event_name,payload.timestamp);
            break;
        case 'SkillAdded':
            break;
        case 'VehicleDestroy':
            break;
        default:
            break;

        }
    }

}

function storeLogin(character_id, event_name, timestamp) {
    const Login = db.Logins;

    // Create a charLogin
    const charLogin = {
        character_id: character_id,
        event_name: event_name,
        timestamp: timestamp
      };
      CharLogin.create(charLogin)
        .then(data => {
          //console.log(data);
        })
        .catch(err => {
          console.log(err);
        });
}

module.exports = {
    createStream
}
