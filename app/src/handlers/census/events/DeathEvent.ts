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

import {injectable} from 'inversify';
import Parser from '../../../utils/parser';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import ZoneUtils from '../../../utils/ZoneUtils';
import {Zone} from '../../../constants/zone';
import {Death, PS2Event} from 'ps2census';

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

    constructor(
        event: PS2Event,
    ) {
        if (!(event instanceof Death)) {
            throw new IllegalArgumentException('event', 'DeathEvent');
        }

        this.worldId = Parser.parseArgumentAsNumber(event.world_id);

        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id', 'DeathEvent');
        }

        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseArgumentAsNumber(event.zone_id));
        this.timestamp = Parser.parseArgumentAsNumber(event.timestamp);

        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp', 'DeathEvent');
        }

        this.characterId = Parser.parseArgumentAsNumber(event.character_id);

        if (isNaN(this.characterId)) {
            throw new IllegalArgumentException('character_id', 'DeathEvent');
        }

        this.characterLoadoutId = Parser.parseArgumentAsNumber(event.character_loadout_id);

        if (isNaN(this.characterLoadoutId)) {
            throw new IllegalArgumentException('character_loadout_id', 'DeathEvent');
        }

        this.attackerCharacterId = Parser.parseArgumentAsNumber(event.attacker_character_id);

        if (isNaN(this.attackerCharacterId)) {
            throw new IllegalArgumentException('attacker_character_id', 'DeathEvent');
        }

        this.attackerLoadoutId = Parser.parseArgumentAsNumber(event.attacker_loadout_id);

        if (isNaN(this.attackerLoadoutId)) {
            throw new IllegalArgumentException('attacker_loadout_id', 'DeathEvent');
        }

        this.attackerVehicleId = Parser.parseArgumentAsNumber(event.attacker_vehicle_id);

        if (isNaN(this.attackerVehicleId)) {
            throw new IllegalArgumentException('attacker_vehicle_id', 'DeathEvent');
        }

        this.attackerWeaponId = Parser.parseArgumentAsNumber(event.attacker_weapon_id);

        if (isNaN(this.attackerWeaponId)) {
            throw new IllegalArgumentException('attacker_weapon_id', 'DeathEvent');
        }

        // No check needed, is boolean
        this.isHeadshot = Parser.parseArgumentAsBoolean(event.is_headshot);
        // attacker_fire_mode_id is not needed right now
    }
}
