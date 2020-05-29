const api_key = require('./api_key.js');
const WebSocket = require('ws');
const db = require("../models");
const eventStore = require('../handlers/eventStoreHandler');
const alertHandler = require('../handlers/alertHandler');


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
    console.log(jsonData);
    if (jsonData.hasOwnProperty('payload')) {
        //define here
        var payload = jsonData.payload;
        switch (payload.event_name) {
        case 'AchievementEarned':
            eventStore.storeAchievementEarned(payload);
            break;
        case 'BattleRankUp':
            eventStore.storeBattleRankUp(payload);
            break;
        case 'Death':
            eventStore.storeDeath(payload);
            break;
        case 'FacilityControl':
            break;
        case 'GainExperience':
            break;
        case 'ItemAdded':
            break;
        case 'MetagameEvent':
            eventStore.storeMetagameEvent(payload);
            break;
        case 'PlayerFacilityCapture':
            break;
        case 'PlayerFacilityDefend':
            break;
        case 'PlayerLogin':
            console.log(payload);
            eventStore.storeLogin(payload.character_id,payload.event_name,payload.timestamp,payload.world_id);
            break;
        case 'PlayerLogout':
            console.log(payload);
            eventStore.storeLogout(payload.character_id,payload.event_name,payload.timestamp,payload.world_id);
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


module.exports = {
    createStream
}
