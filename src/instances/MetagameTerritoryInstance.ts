import InstanceAbstract from './InstanceAbstract';
import {MetagameEventType} from '../constants/metagameEventType';
import {World} from '../constants/world';
import {Zone} from '../constants/zone';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {Ps2alertsEventState} from '../constants/ps2alertsEventState';
import {Bracket} from '../constants/bracket';
import TerritoryResultInterface from '../interfaces/TerritoryResultInterface';

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
}
