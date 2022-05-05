import ApplicationException from '../../exceptions/ApplicationException';
import MetagameTerritoryInstance from '../../instances/MetagameTerritoryInstance';

export default class AdminAggregatorInstanceTrashMessage {
    public readonly instanceId: MetagameTerritoryInstance['instanceId'];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(body: Record<string, any>) {
        if (!body.instanceId) {
            throw new ApplicationException('Failed to parse AdminAggregatorInstanceTrashMessage missing field instanceId', 'AdminAggregatorInstanceTrashMessage');
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.instanceId = body.instanceId;
    }
}
