const api_key = require('./api_key.js');
const axios = require('axios');

const baseUrl = 'http://census.daybreakgames.com/s:'+ api_key.KEY +'/get/ps2:v2/';

function getMapData(worldId, zoneId){
    axios.get(baseUrl + 'map/?world_id='+worldId+'&zone_ids='+zoneId)
        .then(response => {
            const regions = response.data.map_list[0].Regions.Row;
            console.log(regions.length);
        })
        .catch(err => {
            console.log(err);
        })
}

/**
 * Returns a list of all worlds from census
 */
function getWorlds(){
    axios.get(baseUrl + 'world/?c:limit=100')
        .then(response => {
            const worlds = response.data.world_list;
            console.log(worlds);
        })
        .catch(err => {
            console.log(err);
        })
}

function getRegionForZone(zoneId){
    axios.get(baseUrl + 'zone/?zone_id='+zoneId+'&c:join=map_region^list:1')
        .then(response => {
            const regions = response.data.zone_list[0].zone_id_join_map_region;
            console.log(regions.length);
        })
        .catch(err => {
            console.log(err);
        })

}

module.exports = {
    getMapData,
    getWorlds,
    getRegionForZone
}
