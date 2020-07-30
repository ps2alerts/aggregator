import MetagameEventEvent from '../handlers/census/events/MetagameEventEvent';
import {World} from '../constants/world';
import PS2AlertsInstanceInterface from '../instances/PS2AlertsInstanceInterface';
import {Zone} from '../constants/zone';
import {MetagameEventType} from '../constants/metagameEventType';

export default interface InstanceHandlerInterface {
    handleMetagameEvent(mge: MetagameEventEvent): Promise<boolean>;

    getInstance(world: World, zone: Zone): PS2AlertsInstanceInterface|boolean;

    getAllInstances(): PS2AlertsInstanceInterface[];

    startInstance(instance: PS2AlertsInstanceInterface): Promise<boolean>;

    endInstance(instance: PS2AlertsInstanceInterface): Promise<boolean>;
}
