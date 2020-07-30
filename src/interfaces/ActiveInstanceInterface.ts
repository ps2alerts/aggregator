import {MetagameEventIds} from '../constants/metagameEventIds';

export default interface ActiveInstanceInterface {
    instanceId: string;
    censusInstanceId: number;
    metagameEventType: MetagameEventIds;
    world: number;
    zone: number;
    timeStarted: Date;
}
