/* eslint-disable @typescript-eslint/naming-convention */
/** Character centric events */

export interface AchievementEarned {
    event_name: 'AchievementEarned';
    character_id: string;
    timestamp: string;
    world_id: string;
    achievement_id: string;
    zone_id: string;
}

export interface BattleRankUp {
    battle_rank: string;
    character_id: string;
    event_name: 'BattleRankUp';
    timestamp: string;
    world_id: string;
    zone_id: string;
}

export interface Death {
    attacker_character_id: string;
    attacker_fire_mode_id: string;
    attacker_loadout_id: string;
    attacker_vehicle_id: string;
    attacker_weapon_id: string;
    character_id: string;
    character_loadout_id: string;
    event_name: 'Death';
    // is_critical: string,
    is_headshot: string;
    timestamp: string;
    // vehicle_id: string,
    world_id: string;
    zone_id: string;
}

export interface GainExperience {
    amount: string;
    character_id: string;
    event_name: 'GainExperience';
    experience_id: string;
    loadout_id: string;
    other_id: string;
    timestamp: string;
    world_id: string;
    zone_id: string;
}

export interface ItemAdded {
    character_id: string;
    context: string;
    event_name: 'ItemAdded';
    item_count: string;
    item_id: string;
    timestamp: string;
    world_id: string;
    zone_id: string;
}

export interface PlayerFacilityCapture {
    character_id: string;
    event_name: 'PlayerFacilityCapture';
    facility_id: string;
    outfit_id: string;
    timestamp: string;
    world_id: string;
    zone_id: string;
}

export interface PlayerFacilityDefend {
    character_id: string;
    event_name: 'PlayerFacilityDefend';
    facility_id: string;
    outfit_id: string;
    timestamp: string;
    world_id: string;
    zone_id: string;
}

export interface PlayerLogin {
    character_id: string;
    event_name: 'PlayerLogin';
    timestamp: string;
    world_id: string;
}

export interface PlayerLogout {
    character_id: string;
    event_name: 'PlayerLogout';
    timestamp: string;
    world_id: string;
}

export interface SkillAdded {
    character_id: string;
    event_name: 'SkillAdded';
    skill_id: string;
    timestamp: string;
    world_id: string;
    zone_id: string;
}

export interface VehicleDestroy {
    attacker_character_id: string;
    attacker_loadout_id: string;
    attacker_vehicle_id: string;
    attacker_weapon_id: string;
    character_id: string;
    event_name: 'VehicleDestroy';
    facility_id: string;
    faction_id: string;
    timestamp: string;
    vehicle_id: string;
    world_id: string;
    zone_id: string;
}

/** World centric events */

export interface ContinentLock {
    event_name: 'ContinentLock';
    event_type: string;
    metagame_event_id: string;
    nc_population: string;
    previous_faction: string;
    timestamp: string;
    tr_population: string;
    triggering_faction: string;
    vs_population: string;
    world_id: string;
    zone_id: string;
}

export interface ContinentUnlock {
    event_name: 'ContinentUnlock';
    event_type: string;
    metagame_event_id: string;
    nc_population: string;
    previous_faction: string;
    timestamp: string;
    tr_population: string;
    triggering_faction: string;
    vs_population: string;
    world_id: string;
    zone_id: string;
}

export interface FacilityControl {
    duration_held: string;
    event_name: 'FacilityControl';
    facility_id: string;
    new_faction_id: string;
    old_faction_id: string;
    outfit_id: string;
    timestamp: string;
    world_id: string;
    zone_id: string;
}

export interface MetagameEvent {
    event_name: 'MetagameEvent';
    experience_bonus: string;
    faction_nc: string;
    faction_tr: string;
    faction_vs: string;
    metagame_event_id: string;
    metagame_event_state: string;
    metagame_event_state_name: string; // Added
    timestamp: string;
    world_id: string;
    // zone_id: string
}
