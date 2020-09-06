import {World} from '../../constants/world';
import {Zone} from '../../constants/zone';
import ApplicationException from '../../exceptions/ApplicationException';
import {Faction} from '../../constants/faction';
import {Ps2alertsEventState} from '../../constants/ps2alertsEventState';

export enum AdminWebsocketInstanceTypes {
    METAGAME = 'metagame',
}

export default class AdminWebsocketInstanceStartMessage {
    public readonly instanceId: number;
    public readonly world: World;
    public readonly zone: Zone;
    public readonly type: AdminWebsocketInstanceTypes;
    public readonly state: Ps2alertsEventState;
    public readonly faction: Faction;
    public readonly meltdown: boolean;
    public readonly start: Date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(body: Record<string, any>) {
        if (!body.instanceId) {
            throw new ApplicationException('Failed to parse AdminWebsocketInstanceStartMessage missing field instanceId', 'AdminWebsocketInstanceStartMessage');
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.instanceId = body.instanceId;

        if (!body.world) {
            throw new ApplicationException('Failed to parse AdminWebsocketInstanceStartMessage missing field world', 'AdminWebsocketInstanceStartMessage');
        }

        this.world = parseInt(body.world, 10);

        if (!body.zone) {
            throw new ApplicationException('Failed to parse AdminWebsocketInstanceStartMessage missing field zone', 'AdminWebsocketInstanceStartMessage');
        }

        this.zone = parseInt(body.zone, 10);

        if (!body.faction) {
            throw new ApplicationException('Failed to parse AdminWebsocketInstanceStartMessage missing field faction', 'AdminWebsocketInstanceStartMessage');
        }

        if (!body.type) {
            throw new ApplicationException('Failed to parse AdminWebsocketInstanceStartMessage missing field type', 'AdminWebsocketInstanceStartMessage');
        }

        if (body.type === 'metagame') {
            this.type = AdminWebsocketInstanceTypes.METAGAME;
            this.faction = parseInt(body.faction, 10);
        }

        if (typeof body.meltdown === 'undefined') {
            throw new ApplicationException('Failed to parse AdminWebsocketInstanceStartMessage missing field meltdown', 'AdminWebsocketInstanceStartMessage');
        }

        if (!body.start) {
            throw new ApplicationException('Failed to parse AdminWebsocketInstanceStartMessage missing field start', 'AdminWebsocketInstanceStartMessage');
        }

        this.start = new Date(body.start);
    }
}
