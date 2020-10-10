import ApplicationException from '../../exceptions/ApplicationException';
import MetagameTerritoryInstance from '../../instances/MetagameTerritoryInstance';

export default class AdminAggregatorInstanceEndMessage {
    public readonly instanceId: MetagameTerritoryInstance['instanceId'];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(body: Record<string, any>) {
        if (!body.instanceId) {
            throw new ApplicationException('Failed to parse AdminAggregatorEndInstanceMessage missing field instanceId', 'AdminAggregatorEndInstanceMessage');
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.instanceId = body.instanceId;
    }
}
