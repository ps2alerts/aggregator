import MetagameEventEvent from '../handlers/census/events/MetagameEventEvent';
import PS2AlertsInstanceInterface from './PS2AlertsInstanceInterface';
import {World} from '../constants/world';
import {Zone} from '../constants/zone';

export default interface InstanceHandlerInterface {
    handleMetagameEvent(mge: MetagameEventEvent): Promise<boolean>;

    getInstances(world: World, zone: Zone): PS2AlertsInstanceInterface[];

    getAllInstances(): PS2AlertsInstanceInterface[];

    startInstance(instance: PS2AlertsInstanceInterface): Promise<boolean>;

    endInstance(instance: PS2AlertsInstanceInterface): Promise<boolean>;
}
