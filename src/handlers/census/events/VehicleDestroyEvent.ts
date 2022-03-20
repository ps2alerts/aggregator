import {injectable} from 'inversify';
import Parser from '../../../utils/parser';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import ZoneUtils from '../../../utils/ZoneUtils';
import {World} from '../../../constants/world';
import {Zone} from '../../../constants/zone';
import {Destroy, VehicleDestroy} from 'ps2census';
import PS2AlertsInstanceInterface from '../../../interfaces/PS2AlertsInstanceInterface';
import Character from '../../../data/Character';
import {Faction} from '../../../constants/faction';

@injectable()
export default class VehicleDestroyEvent {
    public readonly world: World;
    public readonly zone: Zone;
    public readonly timestamp: Date;
    public readonly characterFaction: Faction;
    public readonly attackerLoadoutId: number;
    public readonly attackerVehicleId: number;
    public readonly attackerWeaponId: number;
    public readonly attackerFaction: Faction;
    public readonly killType: Destroy;
    public readonly vehicleId: number;
    public readonly facilityId: number;

    constructor(
        event: VehicleDestroy,
        public readonly instance: PS2AlertsInstanceInterface,
        public readonly attackerCharacter: Character,
        public readonly character: Character,
    ) {
        this.instance = instance;

        this.world = Parser.parseNumericalArgument(event.world_id);

        if (isNaN(this.world)) {
            throw new IllegalArgumentException('world_id', 'VehicleDestroyEvent');
        }

        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseNumericalArgument(event.zone_id));
        this.timestamp = event.timestamp;

        if (!character) {
            throw new IllegalArgumentException('Character is missing from VehicleDestroyEvent when required', 'VehicleDestroyEvent');
        }

        this.character = character;

        this.characterFaction = Parser.parseNumericalArgument(event.faction_id);

        if (isNaN(this.characterFaction)) {
            throw new IllegalArgumentException('characterFaction', 'VehicleDestroyEvent');
        }

        if (!attackerCharacter) {
            throw new IllegalArgumentException('Attacker Character is missing from VehicleDestroyEvent when required', 'VehicleDestroyEvent');
        }

        this.attackerCharacter = attackerCharacter;

        this.attackerLoadoutId = Parser.parseNumericalArgument(event.attacker_loadout_id);

        if (isNaN(this.attackerLoadoutId)) {
            throw new IllegalArgumentException('attacker_loadout_id', 'VehicleDestroyEvent');
        }

        // This is optional, therefore requires extra figuring out
        const vehicleId = Parser.parseNumericalArgument(event.attacker_vehicle_id);
        this.attackerVehicleId = (!isNaN(vehicleId)) ? vehicleId : 0;

        if (isNaN(this.attackerVehicleId)) {
            throw new IllegalArgumentException('attacker_vehicle_id', 'VehicleDestroyEvent');
        }

        this.attackerWeaponId = Parser.parseNumericalArgument(event.attacker_weapon_id);

        if (isNaN(this.attackerWeaponId)) {
            throw new IllegalArgumentException('attacker_weapon_id', 'VehicleDestroyEvent');
        }

        this.attackerFaction = Parser.parseNumericalArgument(event.attacker_faction);

        if (isNaN(this.attackerFaction)) {
            throw new IllegalArgumentException('attackerFaction', 'VehicleDestroyEvent');
        }

        this.killType = event.kill_type;

        this.vehicleId = Parser.parseNumericalArgument(event.vehicle_id);
        this.facilityId = Parser.parseNumericalArgument(event.facility_id);
    }
}
