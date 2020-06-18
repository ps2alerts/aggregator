const db = require("../../models");
const flags = require("../config/flags.js");
const process = require("process");

function storeLogout(character_id, event_name, timestamp, world_id) {
    // Create a charLogin
    const charLogout = {
        character_id: character_id,
        event_name: event_name,
        timestamp: timestamp,
        world_id: world_id,
    };
    db.PlayerLogouts.create(charLogout)
        .then(data => {
            //console.log(data);
        })
        .catch(err => {
            handleStoreError(err);
        });
}

function storeLogin(character_id, event_name, timestamp, world_id) {
    if (!flags.EVENTS.PlayerLogin) {
        return false;
    }
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
            handleStoreError(err);
        });
}

function storeMetagameEvent(data) {
    if (!flags.EVENTS.MetagameEvent) {
        return false;
    }

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
            handleStoreError(err);
        })
    // if(data.metagame_event_id === '') {
    //     alertHandler.handleAlertEvent(data);
    // }
}

function storeAchievementEarned(data) {
    if (!flags.EVENTS.AchievementEarned) {
        return false;
    }

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
            handleStoreError(err);
        })
}

function storeBattleRankUp(data) {
    if (!flags.EVENTS.BattleRankUp) {
        return false;
    }

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
            handleStoreError(err);
        })
}

function storeContinentLock(data) {
    if (!flags.EVENTS.ContinentLock) {
        return false;
    }

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
            handleStoreError(err);
        })
}

function storeContinentUnlock(data) {
    if (!flags.EVENTS.ContinentUnlock) {
        return false;
    }

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
            handleStoreError(err);
        })
}

function storeDeath(data) {
    if (!flags.EVENTS.Death) {
        return false;
    }

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
            handleStoreError(err);
        })
}

function storeFacilityControl(data) {
    if (!flags.EVENTS.FacilityControl) {
        return false;
    }

    const facilityCapture = {
        duration_held: data.duration_held,
        event_name: data.event_name,
        facility_id: data.facility_id,
        new_faction_id: data.new_faction_id,
        old_faction_id: data.old_faction_id,
        outfit_id: data.outfit_id,
        timestamp: data.timestamp,
        world_id: data.world_id,
        zone_id: data.zone_id
    }
    db.FacilityControls.create(facilityCapture)
        .then(data => {

        })
        .catch(err => {
            handleStoreError(err);
        })

}

function storeGainExperience(data) {
    if (!flags.EVENTS.GainExperience) {
        return false;
    }

    const gainExperience = {
        amount: data.amount,
        character_id: data.character_id,
        experience_id: data.experience_id,
        loadout_id: data.loadout_id,
        other_id: data.other_is,
        timestamp: data.timestamp,
        world_id: data.world_id,
        zone_id: data.zone_id
    }
    db.GainExperiences.create(gainExperience)
        .then(data => {

        })
        .catch(err => {
            handleStoreError(err);
        })
}

function storeItemAdded(data) {
    if (!flags.EVENTS.ItemAdded) {
        return false;
    }

    const itemAdded = {
        character_id: data.character_id,
        context: data.context,
        event_name: data.event_name,
        item_count: data.item_count,
        item_id: data.item_id,
        timestamp: data.timestamp,
        world_id: data.world_id,
        zone_id: data.zone_id
    }
    db.ItemsAdded.create(itemAdded)
        .then(data => {

        })
        .catch(err => {
            handleStoreError(err);
        })
}

function storePlayerFacilityCapture(data) {
    if (!flags.EVENTS.PlayerFacilityCapture) {
        return false;
    }

    const playerFacilityCapture = {
        character_id: data.character_id,
        event_name: data.event_name,
        facility_id: data.facility_id,
        outfit_id: data.outfit_id,
        timestamp: data.timestamp,
        world_id: data.world_id,
        zone_id: data.zone_id
    }
    db.PlayerFacilityCaptures.create(playerFacilityCapture)
        .then(data => {

        })
        .catch(err => {
            handleStoreError(err);
        })
}
function storePlayerFacilityDefend(data){
    if (!flags.EVENTS.PlayerFacilityDefend) {
        return false;
    }

    const playerFacilityDefend = {
        character_id: data.character_id,
        event_name: data.event_name,
        facility_id: data.facility_id,
        outfit_id: data.outfit_id,
        timestamp: data.timestamp,
        world_id: data.world_id,
        zone_id: data.zone_id
    }
    db.PlayerFacilityDefends.create(playerFacilityDefend)
        .then(data => {

        })
        .catch(err => {
            handleStoreError(err);
        })
}
function storeSkillAdded(data) {
    if (!flags.EVENTS.SkillAdded) {
        return false;
    }

    const skillAdded = {
        character_id: data.character_id,
        event_name: data.event_name,
        skill_id: data.skill_id,
        timestamp: data.timestamp,
        world_id: data.world_id,
        zone_id: data.zone_id
    }
}
function storeVehicleDestroy(data) {
    if (!flags.EVENTS.VehicleDestroy) {
        return false;
    }

    const vehicleDestroy = {
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
    db.VehiclesDestroyed.create(vehicleDestroy)
        .then(data => {

        })
        .catch(err => {
            handleStoreError(err);
        })
}

function handleStoreError(err) {
    if (flags.DB_TERMINATE_ON_ERROR) {
        console.log(err);
        console.log("PROCESS ENDED DUE TO DATABASE ERROR!");
        process.exit(1);

    }
    console.log(err);
}

module.exports = {
    storeLogout,
    storeLogin,
    storeMetagameEvent,
    storeAchievementEarned,
    storeBattleRankUp,
    storeContinentLock,
    storeContinentUnlock,
    storeDeath,
    storeFacilityControl,
    storeGainExperience,
    storeItemAdded,
    storePlayerFacilityCapture,
    storePlayerFacilityDefend,
    storeSkillAdded,
    storeVehicleDestroy
}
