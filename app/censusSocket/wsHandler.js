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
            eventStore.storeFacilityControl(payload);
            break;
        case 'GainExperience':
            eventStore.storeGainExperience(payload);
            break;
        case 'ItemAdded':
            eventStore.storeItemAdded(payload);
            break;
        case 'MetagameEvent':
            eventStore.storeMetagameEvent(payload);
            break;
        case 'PlayerFacilityCapture':
            eventStore.storePlayerFacilityCapture(payload);
            break;
        case 'PlayerFacilityDefend':
            eventStore.storePlayerFacilityDefend(payload)
            break;
        case 'PlayerLogin':
            eventStore.storeLogin(payload.character_id,payload.event_name,payload.timestamp,payload.world_id);
            break;
        case 'PlayerLogout':
            eventStore.storeLogout(payload.character_id,payload.event_name,payload.timestamp,payload.world_id);
            break;
        case 'SkillAdded':
            eventStore.storeSkillAdded(payload);
            break;
        case 'VehicleDestroy':
            eventStore.storeVehicleDestroy(payload);
            break;
        default:
            break;

        }
    }

}


module.exports = {
    createStream
}
