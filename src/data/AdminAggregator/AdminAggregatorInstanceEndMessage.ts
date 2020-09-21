import ApplicationException from '../../exceptions/ApplicationException';
import PS2AlertsMetagameInstance from '../../instances/PS2AlertsMetagameInstance';

export default class AdminAggregatorInstanceEndMessage {
    public readonly instanceId: PS2AlertsMetagameInstance['instanceId'];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(body: Record<string, any>) {
        if (!body.instanceId) {
            throw new ApplicationException('Failed to parse AdminAggregatorEndInstanceMessage missing field instanceId', 'AdminAggregatorEndInstanceMessage');
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.instanceId = body.instanceId;
    }
}
