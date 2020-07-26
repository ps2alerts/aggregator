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
import {Death} from 'ps2census';
import ActiveAlertInterface from '../../../interfaces/ActiveAlertInterface';
import {Faction} from '../../../constants/faction';
import FactionUtils from '../../../utils/FactionUtils';

@injectable()
export default class DeathEvent {
    public readonly alert: ActiveAlertInterface;

    public readonly world: World;

    public readonly zone: Zone;

    public readonly timestamp: Date;

    public readonly characterId: string;

    public readonly characterLoadoutId: number;

    public readonly characterFaction: Faction;

    public readonly attackerCharacterId: string;

    public readonly attackerFiremodeId: number;

    public readonly attackerLoadoutId: number;

    public readonly attackerVehicleId: number;

    public readonly attackerWeaponId: number;

    public readonly attackerFaction: Faction;

    public readonly isHeadshot: boolean;

    public readonly isSuicide: boolean;

    public readonly isTeamkill: boolean;

    constructor(
        event: Death,
        alert: ActiveAlertInterface,
    ) {
        this.alert = alert;

        this.world = Parser.parseNumericalArgument(event.world_id);

        if (isNaN(this.world)) {
            throw new IllegalArgumentException('world_id', 'DeathEvent');
        }

        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseNumericalArgument(event.zone_id));

        // Validation not required
        this.timestamp = event.timestamp;

        this.characterId = event.character_id;

        this.characterLoadoutId = Parser.parseNumericalArgument(event.character_loadout_id);

        if (isNaN(this.characterLoadoutId)) {
            throw new IllegalArgumentException('character_loadout_id', 'DeathEvent');
        }

        this.characterFaction = FactionUtils.parseFactionFromClass(this.characterLoadoutId);

        this.attackerCharacterId = event.attacker_character_id; // This is a sting on purpose

        this.attackerFiremodeId = Parser.parseNumericalArgument(event.attacker_fire_mode_id);

        if (isNaN(this.attackerFiremodeId)) {
            throw new IllegalArgumentException('attacker_fire_mode_id', 'DeathEvent');
        }

        this.attackerLoadoutId = Parser.parseNumericalArgument(event.attacker_loadout_id);

        if (isNaN(this.attackerLoadoutId)) {
            throw new IllegalArgumentException('attacker_loadout_id', 'DeathEvent');
        }

        this.attackerFaction = FactionUtils.parseFactionFromClass(this.attackerLoadoutId);

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

        // Additional logic to figure out things Census doesn't tell us...
        this.isSuicide = this.characterId === this.attackerCharacterId;

        // TK logic, does NOT include NSO. If same faction but not same character
        this.isTeamkill = this.attackerFaction === this.characterFaction && !this.isSuicide;
    }
}
