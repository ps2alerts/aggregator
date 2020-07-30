import MetagameEventEvent from '../handlers/census/events/MetagameEventEvent';
import ActiveInstanceInterface from './ActiveInstanceInterface';

export default interface ActiveInstanceAuthorityInterface {
    instanceExists(world: number, zone: number): boolean;

    getInstance(world: number, zone: number): ActiveInstanceInterface;

    getAllInstances(): Map<string, ActiveInstanceInterface>;

    addInstance(mge: MetagameEventEvent): Promise<boolean>;

    endInstance(instance: ActiveInstanceInterface): Promise<boolean>;
}
