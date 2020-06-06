const censusServiceId = require('../config/census.serviceid');
const WebSocket = require('ws');
const db = require("../models");
const eventStore = require('../handlers/eventStoreHandler');
const alertHandler = require('../handlers/alertHandler');
const activeWorldValidator = require('../validators/activeWorld.js');
const activeZoneValidator = require('../validators/activeZone.js');


function createStream() {
    console.log("Creating Websocket Stream...");
    const ws = new WebSocket('wss://push.planetside2.com/streaming?environment=ps2&service-id=s:' + censusServiceId.CENSUS_ID);
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

    const obj = {
        service: "event",
        action: "subscribe",
        characters: ["all"],
        eventNames: ["all"],
        worlds: ["all"],
        logicalAndCharactersWithWorlds: true
    }

    ws.send(JSON.stringify((obj)));
    console.log('Subscribed successfully to Census Websocket Stream!');
}

function handleWsResponse(raw) {
    //console.log(raw);

    jsonData = JSON.parse(raw);
    if (jsonData.hasOwnProperty('payload')) {
        //define here
        var payload = jsonData.payload;

        // Validate if the message is relevent for what we want, e.g. worlds and zones with active alerts on.
        if (!activeWorldValidator.validate(payload)) {
            return false;
        }
        if (!activeZoneValidator.validate(payload)) {
            return false;
        }

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
