import InstanceAbstract from './InstanceAbstract';
import {MetagameEventType} from '../ps2alerts-constants/metagameEventType';
import {World} from '../ps2alerts-constants/world';
import {Zone} from '../ps2alerts-constants/zone';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {Ps2alertsEventState} from '../ps2alerts-constants/ps2alertsEventState';
import {Bracket} from '../ps2alerts-constants/bracket';
import TerritoryResultInterface from '../interfaces/TerritoryResultInterface';
import moment from 'moment/moment';

export default class MetagameTerritoryInstance extends InstanceAbstract implements PS2AlertsInstanceInterface {
    public bracket?: Bracket;

    constructor(
        public readonly world: World,
        public readonly timeStarted: Date,
        public timeEnded: Date | null,
        public result: TerritoryResultInterface | null,
        public readonly zone: Zone,
        public readonly censusInstanceId: number,
        public readonly censusMetagameEventType: MetagameEventType,
        public readonly duration: number, // Stored in Milliseconds
        public state: Ps2alertsEventState,
        bracket?: Bracket,
    ) {
        super(
            `${world}-${censusInstanceId}`,
            world,
            timeStarted,
            timeEnded,
            result,
        );
        this.bracket = bracket ?? undefined;
    }

    public match(world: World, zone: Zone): boolean {
        return world === this.world && zone === this.zone;
    }

    public overdue(): boolean {
        // If now in milliseconds is greater than start time + duration
        return Date.now() > (this.timeStarted.getTime() + this.duration);
    }

    // Returns the current second tick of the alert
    public currentDuration(): number {
        // Return current difference in seconds between start and now
        const nowUnix = moment().unix() * 1000;
        // Holy mother of brackets batman!
        return parseInt(((nowUnix - this.timeStarted.getTime()) / 1000).toFixed(0), 10);
    }
}
