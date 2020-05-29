const api_key = require('./api_key.js');
const axios = require('axios');

const baseUrl = 'http://census.daybreakgames.com/s:'+ api_key.KEY +'/get/ps2:v2/';

function getMapData(worldId, zoneId){
    axios.get(baseUrl + 'map/?world_id='+worldId+'&zone_ids='+zoneId)
        .then(data => {

        })
        .catch(err => {
            console.log(err);
        })
}

function getWorlds(){
    axios.get(baseUrl + 'world/?c:limit=100')
        .then(data => {

        })
        .catch(err => {
            console.log(err);
        })
}

function getRegionForZone(zoneId){
    axios.get(baseUrl + 'zone/?zone_id='+zoneId+'&c:join=map_region^list:1')
        .then(data => {

        })
        .catch(err => {
            console.log(err);
        })

}

module.exports = {

}