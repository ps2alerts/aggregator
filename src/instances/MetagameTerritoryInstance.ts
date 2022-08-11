import InstanceAbstract from './InstanceAbstract';
import {MetagameEventType} from '../ps2alerts-constants/metagameEventType';
import {World} from '../ps2alerts-constants/world';
import {Zone} from '../ps2alerts-constants/zone';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {Ps2alertsEventState} from '../ps2alerts-constants/ps2alertsEventState';
import {Bracket} from '../ps2alerts-constants/bracket';
import {Ps2alertsEventType} from '../ps2alerts-constants/ps2alertsEventType';
import {
    MetagameTerritoryControlResultInterface,
} from '../ps2alerts-constants/interfaces/MetagameTerritoryControlResultInterface';

export default class MetagameTerritoryInstance extends InstanceAbstract implements PS2AlertsInstanceInterface {
    public bracket?: Bracket;

    constructor(
        public readonly world: World,
        public readonly zone: Zone,
        public readonly censusInstanceId: number,
        public readonly timeStarted: Date,
        public timeEnded: Date | null,
        public result: MetagameTerritoryControlResultInterface | null,
        public readonly censusMetagameEventType: MetagameEventType,
        duration: number, // Stored in Milliseconds
        state: Ps2alertsEventState,
        bracket?: Bracket,
    ) {
        super(
            `${world}-${censusInstanceId}`,
            world,
            zone,
            timeStarted,
            timeEnded,
            duration,
            state,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            Ps2alertsEventType.LIVE_METAGAME,
        );
        this.bracket = bracket ?? undefined;
    }

    public match(world: World | null = null, zone: Zone | null = null): boolean {
        return world && zone
            ? world === this.world && zone === this.zone
            : world ? world === this.world
            : zone === this.zone;
    }
}
