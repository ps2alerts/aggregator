import ApplicationException from '../../exceptions/ApplicationException';
import PS2AlertsMetagameInstance from '../../instances/PS2AlertsMetagameInstance';

export default class AdminWebsocketInstanceEndMessage {
    public readonly instanceId: PS2AlertsMetagameInstance['instanceId'];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(body: Record<string, any>) {
        if (!body.instanceId) {
            throw new ApplicationException('Failed to parse AdminWebsocketEndInstanceMessage missing field instanceId', 'AdminWebsocketEndInstanceMessage');
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.instanceId = body.instanceId;
    }
}
