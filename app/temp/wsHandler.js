//const censusServiceId = require('../config/census.serviceid');
const WebSocket = require('ws');
const db = require('./models');
const eventStore = require('./eventStoreHandler');
const alertHandler = require('./alertHandler');
const activeWorldValidator = require('./validators/activeWorld.js');
const activeZoneValidator = require('./validators/activeZone.js');
const api_key = require('./api_key');

function createStream() {
    console.log('Creating Websocket Stream...');
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

    const obj1 = {
        service: 'event',
        action:  'subscribe',
        characters: ['all'],
        worlds: ['1','9','10','11','13','17','18','19','25','1000','1001'],
        eventNames: ['Death','PlayerLogin','PlayerLogout','PlayerFacilityDefend',
                        'PlayerFacilityCapture', ,'BattleRankUp','VehicleDestroy'],
        //logicalAndCharactersWithWorlds: true
    }
    const obj2 = {
        service: 'event',
        action:  'subscribe',
        characters: ['all'],
        worlds: ['1','9','10','11','13','17','18','19','25','1000','1001'],
        eventNames: ['GainExperience','ItemAdded'],
        //logicalAndCharactersWithWorlds: true
    }
    const obj3 = {
        service: 'event',
        action:  'subscribe',
        worlds: ['1','9','10','11','13','17','18','19','25','1000','1001'],
        eventNames: ['FacilityControl','MetagameEvent','ContinentLock','ContinentUnlock'],
        //logicalAndCharactersWithWorlds: true
    }

    ws.send(JSON.stringify((obj1)));
    console.log('Subscribed to - deats,login,captures,vehicles');
    ws.send(JSON.stringify((obj2)));
    console.log('Subscribed to xp and items');
    ws.send(JSON.stringify((obj3)));
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
        case 'ContinentLock':
            eventStore.storeContinentLock(payload);
            break;
        case 'ContinentUnlock':
            eventStore.storeContinentUnlock(payload);
            break;
        default:
            break;
        }
    }

}


module.exports = {
    createStream
}
