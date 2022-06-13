/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {World} from '../../constants/world';
import {Zone} from '../../constants/zone';
import ApplicationException from '../../exceptions/ApplicationException';
import {Faction} from '../../constants/faction';
import {Ps2alertsEventState} from '../../constants/ps2alertsEventState';

export enum AdminAggregatorInstanceTypes {
    METAGAME = 'metagame',
}

export default class AdminAggregatorInstanceStartMessage {
    public readonly instanceId: number;
    public readonly world: World;
    public readonly zone: Zone;
    public readonly type: AdminAggregatorInstanceTypes;
    public readonly state: Ps2alertsEventState;
    public readonly faction: Faction;
    public readonly meltdown: boolean;
    public readonly start: Date;
    public readonly duration: number;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(body: Record<string, any>) {
        if (!body.instanceId) {
            throw new ApplicationException('Failed to parse AdminAggregatorInstanceStartMessage missing field instanceId', 'AdminAggregatorInstanceStartMessage');
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.instanceId = parseInt(body.instanceId, 10);

        if (!body.world) {
            throw new ApplicationException('Failed to parse AdminAggregatorInstanceStartMessage missing field world', 'AdminAggregatorInstanceStartMessage');
        }

        this.world = parseInt(body.world, 10);

        if (!body.zone) {
            throw new ApplicationException('Failed to parse AdminAggregatorInstanceStartMessage missing field zone', 'AdminAggregatorInstanceStartMessage');
        }

        this.zone = parseInt(body.zone, 10);

        if (!body.faction) {
            throw new ApplicationException('Failed to parse AdminAggregatorInstanceStartMessage missing field faction', 'AdminAggregatorInstanceStartMessage');
        }

        if (!body.type) {
            throw new ApplicationException('Failed to parse AdminAggregatorInstanceStartMessage missing field type', 'AdminAggregatorInstanceStartMessage');
        }

        if (body.type === 'metagame') {
            this.type = AdminAggregatorInstanceTypes.METAGAME;
            this.faction = parseInt(body.faction, 10);
        }

        if (typeof body.meltdown === 'undefined') {
            throw new ApplicationException('Failed to parse AdminAggregatorInstanceStartMessage missing field meltdown', 'AdminAggregatorInstanceStartMessage');
        }

        if (!body.start) {
            throw new ApplicationException('Failed to parse AdminAggregatorInstanceStartMessage missing field start', 'AdminAggregatorInstanceStartMessage');
        }

        // Default this to full duration unless otherwise specified
        this.duration = (60 * 90) * 1000;

        // We expect this in seconds, we convert this to milliseconds
        if (typeof body.duration !== 'undefined') {
            this.duration = parseInt(body.duration, 10) * 1000;
        }

        this.start = new Date(body.start);
    }
}
