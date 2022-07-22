import {World} from '../../../ps2alerts-constants/world';
import {Zone} from '../../../ps2alerts-constants/zone';
import PS2AlertsInstanceInterface from '../../../interfaces/PS2AlertsInstanceInterface';

export default class InstanceEvent {
    public readonly timestamp: Date;
    public readonly instance: PS2AlertsInstanceInterface;
    public readonly world: World;
    public readonly zone: Zone;

    constructor(timestamp: Date, instance: PS2AlertsInstanceInterface) {
        this.timestamp = timestamp;
        this.world = instance.world;
        this.zone = instance.zone;
        this.instance = instance;
    }
}
