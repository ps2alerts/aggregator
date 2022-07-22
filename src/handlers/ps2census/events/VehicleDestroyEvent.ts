import {injectable} from 'inversify';
import Parser from '../../../utils/parser';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import {Destroy, VehicleDestroy} from 'ps2census';
import Character from '../../../data/Character';
import InstanceEvent from './InstanceEvent';
import PS2EventQueueMessage from '../../messages/PS2EventQueueMessage';

@injectable()
export default class VehicleDestroyEvent extends InstanceEvent {
    public readonly attackerLoadoutId: number;
    public readonly attackerVehicleId: number;
    public readonly attackerWeaponId: number;
    public readonly killType: Destroy;
    public readonly vehicleId: number;
    public readonly facilityId: number;

    constructor(
        event: PS2EventQueueMessage<VehicleDestroy>,
        public readonly character: Character,
        public readonly attackerCharacter: Character,
    ) {
        super(event.payload.timestamp, event.instance);

        this.attackerLoadoutId = Parser.parseNumericalArgument(event.payload.attacker_loadout_id);

        if (isNaN(this.attackerLoadoutId)) {
            throw new IllegalArgumentException('attacker_loadout_id', 'VehicleDestroyEvent');
        }

        const vehicleId = Parser.parseNumericalArgument(event.payload.attacker_vehicle_id);
        this.attackerVehicleId = (!isNaN(vehicleId)) ? vehicleId : 0;

        if (isNaN(this.attackerVehicleId)) {
            throw new IllegalArgumentException('attacker_vehicle_id', 'VehicleDestroyEvent');
        }

        this.attackerWeaponId = Parser.parseNumericalArgument(event.payload.attacker_weapon_id);

        if (isNaN(this.attackerWeaponId)) {
            throw new IllegalArgumentException('attacker_weapon_id', 'VehicleDestroyEvent');
        }

        this.killType = event.payload.kill_type;

        this.vehicleId = Parser.parseNumericalArgument(event.payload.vehicle_id);
        this.facilityId = Parser.parseNumericalArgument(event.payload.facility_id);
    }
}
