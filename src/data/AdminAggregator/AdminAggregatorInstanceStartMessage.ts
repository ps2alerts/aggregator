/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {World} from '../../ps2alerts-constants/world';
import {Zone} from '../../ps2alerts-constants/zone';
import ApplicationException from '../../exceptions/ApplicationException';
import {Faction} from '../../ps2alerts-constants/faction';
import {Ps2alertsEventState} from '../../ps2alerts-constants/ps2alertsEventState';
import {getZoneIdFromBinary, getZoneInstanceIdFromBinary} from '../../utils/binaryZoneIds';

export default class AdminAggregatorInstanceStartMessage {
    public readonly type: 'territory' | 'outfitwars';
    public readonly instanceId: number;
    public readonly world: World;
    public readonly zone: Zone;
    public readonly zoneInstanceId: number | null;
    public readonly state: Ps2alertsEventState;
    public readonly faction: Faction;
    public readonly meltdown = false;
    public readonly start: Date;
    public readonly duration: number;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(body: Record<string, any>) {
        if (!body.metagameType) {
            throw new ApplicationException('Type of alert was not provided', 'AdminAggregatorInstanceStartMessage');
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        if (!body.metagameType.indexOf(['territory', 'outfitwars'])) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Type of alert was incorrect / unsupported! Supplied: ${body.metagameType}`);
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.type = body.metagameType;

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

        if (this.type === 'outfitwars') {
            this.zone = getZoneIdFromBinary(parseInt(body.zone, 10));
            this.zoneInstanceId = getZoneInstanceIdFromBinary(parseInt(body.zone, 10));
        } else {
            this.zone = parseInt(body.zone, 10);
            this.zoneInstanceId = null;
        }

        if (!body.faction) {
            throw new ApplicationException('Failed to parse AdminAggregatorInstanceStartMessage missing field faction', 'AdminAggregatorInstanceStartMessage');
        }

        this.faction = parseInt(body.faction, 10);

        if (!body.start) {
            throw new ApplicationException('Failed to parse AdminAggregatorInstanceStartMessage missing field start', 'AdminAggregatorInstanceStartMessage');
        }

        // Default this to full duration unless otherwise specified
        this.duration = body.duration !== undefined ? parseInt(body.duration, 10) * 1000 : (60 * 90) * 1000;

        this.start = new Date(parseInt(body.start, 10) * 1000);
    }
}
