import {injectable} from 'inversify';
import Parser from '../../../utils/parser';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import {Death, Kill} from 'ps2census';
import Character from '../../../data/Character';
import {Vehicle} from '../../../ps2alerts-constants/vehicle';
import {Loadout} from '../../../ps2alerts-constants/loadout';
import {ItemInterface} from '../../../interfaces/ItemInterface';
import PS2EventQueueMessage from '../../messages/PS2EventQueueMessage';
import InstanceEvent from './InstanceEvent';

@injectable()
export default class DeathEvent extends InstanceEvent {
    public readonly characterLoadoutId: Loadout;
    public readonly attackerFiremodeId: number;
    public readonly attackerLoadoutId: Loadout;
    public readonly attackerVehicleId: Vehicle;
    public readonly isHeadshot: boolean;
    public readonly killType: Kill;

    constructor(
        event: PS2EventQueueMessage<Death>,
        public readonly attackerCharacter: Character,
        public readonly character: Character,
        public readonly attackerWeapon: ItemInterface,
    ) {
        super(event.payload.timestamp, event.instance);

        if (!character) {
            throw new IllegalArgumentException('Character is missing from DeathEvent when required', 'DeathEvent');
        }

        this.character = character;

        this.characterLoadoutId = Parser.parseNumericalArgument(event.payload.character_loadout_id);

        if (isNaN(this.characterLoadoutId)) {
            throw new IllegalArgumentException('character_loadout_id', 'DeathEvent');
        }

        if (!attackerCharacter) {
            throw new IllegalArgumentException('Attacker Character is missing from DeathEvent when required', 'DeathEvent');
        }

        this.attackerCharacter = attackerCharacter;

        this.attackerFiremodeId = Parser.parseNumericalArgument(event.payload.attacker_fire_mode_id);

        if (isNaN(this.attackerFiremodeId)) {
            throw new IllegalArgumentException('attacker_fire_mode_id', 'DeathEvent');
        }

        this.attackerLoadoutId = Parser.parseNumericalArgument(event.payload.attacker_loadout_id);

        if (isNaN(this.attackerLoadoutId)) {
            throw new IllegalArgumentException('attacker_loadout_id', 'DeathEvent');
        }

        // This is optional, therefore requires extra figuring out
        const vehicleId = Parser.parseNumericalArgument(event.payload.attacker_vehicle_id);
        this.attackerVehicleId = (!isNaN(vehicleId)) ? vehicleId : 0;

        if (isNaN(this.attackerVehicleId)) {
            throw new IllegalArgumentException('attacker_vehicle_id', 'DeathEvent');
        }

        this.attackerWeapon = attackerWeapon;

        if (this.attackerWeapon.id === undefined) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            throw new IllegalArgumentException('attackerWeapon', 'DeathEvent');
        }

        this.isHeadshot = event.payload.is_headshot;

        this.killType = event.payload.kill_type;

        this.attackerVehicleId = Parser.parseNumericalArgument(event.payload.attacker_vehicle_id);
    }
}
