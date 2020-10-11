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
import {World} from '../../../constants/world';
import {Zone} from '../../../constants/zone';
import {Death, Kill} from 'ps2census';
import PS2AlertsInstanceInterface from '../../../interfaces/PS2AlertsInstanceInterface';
import Character from '../../../data/Character';
import {Vehicle} from '../../../constants/vehicle';
import {Loadout} from '../../../constants/loadout';

@injectable()
export default class DeathEvent {
    public readonly instance: PS2AlertsInstanceInterface;
    public readonly world: World;
    public readonly zone: Zone;
    public readonly timestamp: Date;
    public readonly character: Character;
    public readonly characterLoadoutId: number;
    public readonly attackerCharacter: Character;
    public readonly attackerFiremodeId: number;
    public readonly attackerLoadoutId: Loadout;
    public readonly attackerVehicleId: Vehicle;
    public readonly attackerWeaponId: number;
    public readonly isHeadshot: boolean;
    public readonly killType: Kill;

    constructor(
        event: Death,
        instance: PS2AlertsInstanceInterface,
        attackerCharacter: Character,
        character: Character,
    ) {
        this.instance = instance;

        this.world = Parser.parseNumericalArgument(event.world_id);

        if (isNaN(this.world)) {
            throw new IllegalArgumentException('world_id', 'DeathEvent');
        }

        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseNumericalArgument(event.zone_id));
        this.timestamp = event.timestamp;

        if (!character) {
            throw new IllegalArgumentException('Character is missing from DeathEvent when required', 'DeathEvent');
        }

        this.character = character;

        this.characterLoadoutId = Parser.parseNumericalArgument(event.character_loadout_id);

        if (isNaN(this.characterLoadoutId)) {
            throw new IllegalArgumentException('character_loadout_id', 'DeathEvent');
        }

        if (!attackerCharacter) {
            throw new IllegalArgumentException('Attacker Character is missing from DeathEvent when required', 'DeathEvent');
        }

        this.attackerCharacter = attackerCharacter;

        this.attackerFiremodeId = Parser.parseNumericalArgument(event.attacker_fire_mode_id);

        if (isNaN(this.attackerFiremodeId)) {
            throw new IllegalArgumentException('attacker_fire_mode_id', 'DeathEvent');
        }

        this.attackerLoadoutId = Parser.parseNumericalArgument(event.attacker_loadout_id);

        if (isNaN(this.attackerLoadoutId)) {
            throw new IllegalArgumentException('attacker_loadout_id', 'DeathEvent');
        }

        // This is optional, therefore requires extra figuring out
        const vehicleId = Parser.parseNumericalArgument(event.attacker_vehicle_id);
        this.attackerVehicleId = (!isNaN(vehicleId)) ? vehicleId : 0;

        if (isNaN(this.attackerVehicleId)) {
            throw new IllegalArgumentException('attacker_vehicle_id', 'DeathEvent');
        }

        this.attackerWeaponId = Parser.parseNumericalArgument(event.attacker_weapon_id);

        if (isNaN(this.attackerWeaponId)) {
            throw new IllegalArgumentException('attacker_weapon_id', 'DeathEvent');
        }

        this.isHeadshot = event.is_headshot;

        this.killType = event.kill_type;

        this.attackerVehicleId = Parser.parseNumericalArgument(event.attacker_vehicle_id);
    }
}
