/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "attacker_character_id":"",
 "attacker_fire_mode_id":"",
 "attacker_loadout_id":"",
 "attacker_vehicle_id":"",
 "attacker_weapon_id":"",
 "character_id":"",
 "character_loadout_id":"",
 "is_critical":"",
 "is_headshot":"",
 "timestamp":"",
 "vehicle_id":"",
 "world_id":"",
 "zone_id":""
 * ### END ###
 **/

import { injectable } from 'inversify';
import { GenericEvent } from '../../../types/censusEventTypes';
import { Death } from 'ps2census/dist/client/utils/PS2Events';
import Parser from '../../../utils/parser';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import ZoneUtils from '../../../utils/ZoneUtils';
import { Zone } from '../../../constants/zone';

@injectable()
export default class DeathEvent {
    public readonly worldId: number;
    public readonly zone: Zone;
    public readonly timestamp: number;
    public readonly characterId: number;
    public readonly characterLoadoutId: number;
    public readonly attackerCharacterId: number;
    public readonly attackerLoadoutId: number;
    public readonly attackerVehicleId: number;
    public readonly attackerWeaponId: number;
    public readonly isHeadshot: boolean;

    public constructor(
        event: GenericEvent
    ) {
        const deathEvent = event as Death;
        this.worldId = Parser.parseArgumentAsNumber(deathEvent.world_id);
        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id', 'DeathEvent');
        }
        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseArgumentAsNumber(deathEvent.zone_id));
        this.timestamp = Parser.parseArgumentAsNumber(deathEvent.timestamp);
        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp', 'DeathEvent');
        }
        this.characterId = Parser.parseArgumentAsNumber(deathEvent.character_id);
        if (isNaN(this.characterId)) {
            throw new IllegalArgumentException('character_id', 'DeathEvent');
        }
        this.characterLoadoutId = Parser.parseArgumentAsNumber(deathEvent.character_loadout_id);
        if (isNaN(this.characterLoadoutId)) {
            throw new IllegalArgumentException('character_loadout_id', 'DeathEvent');
        }
        this.attackerCharacterId = Parser.parseArgumentAsNumber(deathEvent.attacker_character_id);
        if (isNaN(this.attackerCharacterId)) {
            throw new IllegalArgumentException('attacker_character_id', 'DeathEvent');
        }
        this.attackerLoadoutId = Parser.parseArgumentAsNumber(deathEvent.attacker_loadout_id);
        if (isNaN(this.attackerLoadoutId)) {
            throw new IllegalArgumentException('attacker_loadout_id', 'DeathEvent');
        }
        this.attackerVehicleId = Parser.parseArgumentAsNumber(deathEvent.attacker_vehicle_id);
        if (isNaN(this.attackerVehicleId)) {
            throw new IllegalArgumentException('attacker_vehicle_id', 'DeathEvent');
        }
        this.attackerWeaponId = Parser.parseArgumentAsNumber(deathEvent.attacker_weapon_id);
        if (isNaN(this.attackerWeaponId)) {
            throw new IllegalArgumentException('attacker_weapon_id', 'DeathEvent');
        }
        // No check needed, is boolean
        this.isHeadshot = Parser.parseArgumentAsBoolean(deathEvent.is_headshot);
        // attacker_fire_mode_id is not needed right now
    }
}
