const db = require("../models");

function storeLogout(character_id, event_name, timestamp, world_id) {
    // Create a charLogin
    const charLogin = {
        character_id: character_id,
        event_name: event_name,
        timestamp: timestamp,
        world_id: world_id,
    };
    db.PlayerLogouts.create(charLogin)
        .then(data => {
            //console.log(data);
        })
        .catch(err => {
            console.log(err);
        });
}

function storeLogin(character_id, event_name, timestamp, world_id) {
    // Create a charLogin
    const charLogin = {
        character_id: character_id,
        event_name: event_name,
        timestamp: timestamp,
        world_id: world_id
    };
    db.PlayerLogins.create(charLogin)
        .then(data => {
            //console.log(data);
        })
        .catch(err => {
            console.log(err);
        });
}

function storeMetagameEvent(data) {
    //insert record in db with raw data
    const metagameEvent = {
        event_name: data.event_name,
        experience_bonus: data.experience_bonus,
        faction_nc: data.faction_nc,
        faction_tr: data.faction_tr,
        faction_vs: data.faction_vs,
        metagame_event_id: data.metagame_event_id,
        metagame_event_state: data.metagame_event_state,
        timestamp: data.timestamp,
        world_id: data.world_id,
        zone_id: data.zone_id
    }
    db.MetagameEvents.create(metagameEvent)
        .then(data => {

        })
        .catch(err => {
            console.log(err);
        })
    // if(data.metagame_event_id === '') {
    //     alertHandler.handleAlertEvent(data);
    // }
}

function storeAchievementEarned(data) {
    const achievementEarned = {
        character_id: data.character_id,
        event_name: data.event_name,
        achievement_id: data.achievement_id,
        world_id: data.world_id,
        zone_id: data.zone_id,
        timestamp: data.timestamp
    }

    db.AchievementsEarned.create(achievementEarned)
        .then(data => {

        })
        .catch(err => {
            console.log(err)
        })
}

function storeBattleRankUp(data) {
    const battleRankUp = {
        character_id: data.character_id,
        event_name: data.event_name,
        battle_rank: data.battle_rank,
        world_id: data.world_id,
        zone_id: data.zone_id,
        timestamp: data.timestamp
    }

    db.BattleRankUps.create(battleRankUp)
        .then(data => {

        })
        .catch(err => {
            console.log(err);
        })
}

function storeContinentLock(data) {
    const continentLock = {
        event_name: data.event_name,
        timestamp: data.timestamp,
        battle_rank: data.battle_rank,
        world_id: data.world_id,
        zone_id: data.zone_id,
        triggering_faction: data.triggering_faction,
        previous_faction: data.previous_faction,
        vs_population: data.vs_population,
        nc_population: data.nc_population,
        tr_population: data.tr_population,
        metagame_event_id: data.metagame_event_id,
        event_type: data.event_type
    }
    db.ContinentLocks.create(continentLock)
        .then(data => {

        })
        .catch(err => {
            console.log(err);
        })
}

function storeContinentUnlock(data) {
    const continentUnlock = {
        event_name: data.event_name,
        timestamp: data.timestamp,
        battle_rank: data.battle_rank,
        world_id: data.world_id,
        zone_id: data.zone_id,
        triggering_faction: data.triggering_faction,
        previous_faction: data.previous_faction,
        vs_population: data.vs_population,
        nc_population: data.nc_population,
        tr_population: data.tr_population,
        metagame_event_id: data.metagame_event_id,
        event_type: data.event_type
    }
    db.ContinentUnlocks.create(continentUnlock)
        .then(data => {

        })
        .catch(err => {
            console.log(err)
        })
}

function storeDeath(data) {
    const death = {
        attacker_character_id: data.attacker_character_id,
        attacker_fire_mode_id: data.attacker_fire_mode_id,
        attacker_loadout_id: data.attacker_loadout_id,
        attacker_vehicle_id: data.attacker_vehicle_id,
        attacker_weapon_id: data.attacker_weapon_id,
        character_id: data.character_id,
        character_loadout_id: data.character_loadout_id,
        event_name: data.event_name,
        is_critical: data.hasOwnProperty('is_critical') ? data.is_critical : 0,
        is_headshot: data.is_headshot,
        timestamp: data.timestamp,
        vehicle_id: data.hasOwnProperty('vehicle_id') ? data.vehicle_id : 0,
        world_id: data.world_id,
        zone_id: data.zone_id

    }
    db.Deaths.create(death)
        .then(data => {

        })
        .catch(err => {
            console.log(err);
        })
}

module.exports = {
    storeLogout,
    storeLogin,
    storeMetagameEvent,
    storeAchievementEarned,
    storeBattleRankUp,
    storeContinentLock,
    storeContinentUnlock,
    storeDeath
}
