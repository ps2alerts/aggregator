import InstanceAbstract from './InstanceAbstract';
import {MetagameEventType} from '../constants/metagameEventType';
import {World} from '../constants/world';
import {Zone} from '../constants/zone';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {Ps2alertsEventState} from '../constants/ps2alertsEventState';
import {MetagameTerritoryResult} from '../victories/TerritoryVictoryCondition';

export default class MetagameTerritoryInstance extends InstanceAbstract implements PS2AlertsInstanceInterface {
    public readonly zone: Zone;
    public readonly censusInstanceId: number;
    public readonly censusMetagameEventType: MetagameEventType;
    public readonly duration: number;
    public state: Ps2alertsEventState;
    public result: MetagameTerritoryResult | null;

    constructor(
        world: World,
        timeStarted: Date,
        timeEnded: Date | null,
        zone: Zone,
        censusInstanceId: number,
        censusMetagameEventType: MetagameEventType,
        duration: number, // Stored in Milliseconds
        state: Ps2alertsEventState,
        result: MetagameTerritoryResult | null,
    ) {
        super(
            `${world}-${censusInstanceId}`,
            world,
            timeStarted,
            timeEnded,
        );
        this.zone = zone;
        this.censusInstanceId = censusInstanceId;
        this.censusMetagameEventType = censusMetagameEventType;
        this.duration = duration;
        this.state = state;
        this.result = result;
    }

    public match(world: World, zone: Zone): boolean {
        return world === this.world && zone === this.zone;
    }

    public overdue(): boolean {
        // If now in milliseconds is greater than start time + duration
        return Date.now() > (this.timeStarted.getTime() + this.duration);
    }
}
