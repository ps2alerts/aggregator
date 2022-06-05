/* eslint-disable @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any */
import {ps2alertsAggregatorQueueEvents} from '../constants/ps2alertsAggregatorQueueEvents';

export default class AggregatorQueueMessage {
    public readonly type: ps2alertsAggregatorQueueEvents;
    public readonly data: any;

    constructor(type: ps2alertsAggregatorQueueEvents, data: any) {
        this.type = type;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.data = data;
    }
}
