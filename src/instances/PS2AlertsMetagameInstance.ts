import PS2AlertsInstanceAbstract from './PS2AlertsInstanceAbstract';
import {Ps2alertsEventType} from '../constants/ps2alertsEventType';
import {MetagameEventType} from '../constants/metagameEventType';
import {MetagameEventState} from '../constants/metagameEventState';
import {World} from '../constants/world';
import {Zone} from '../constants/zone';
import PS2AlertsInstanceInterface from './PS2AlertsInstanceInterface';
import ApplicationException from '../exceptions/ApplicationException';

export default class PS2AlertsMetagameInstance extends PS2AlertsInstanceAbstract implements PS2AlertsInstanceInterface {
    public readonly zone: Zone;
    public readonly censusInstanceId: number;
    public readonly censusMetagameEventType: MetagameEventType;
    public state: MetagameEventState;

    constructor(
        world: World,
        timeStarted: Date,
        timeEnded: Date | null,
        zone: Zone,
        censusInstanceId: number,
        censusMetagameEventType: MetagameEventType,
        state: MetagameEventState,
    ) {
        super(
            `${world}-${censusInstanceId}`, // lul
            world,
            timeStarted,
            timeEnded,
        );
        this.zone = zone;
        this.censusInstanceId = censusInstanceId;
        this.censusMetagameEventType = censusMetagameEventType;
        this.state = state;
    }

    public match(world: World, zone: Zone) {
        return world === this.world && zone === this.zone;
    }

    public overdue(): boolean {
        // If now in milliseconds is greater than start time + duration + threshold
        return Date.now() > (this.timeStarted.getTime() + 3600000 + 60000);
    }

    public duration(): number {
        switch (this.censusMetagameEventType) {
            case MetagameEventType.MELTDOWN_AMERISH:
            case MetagameEventType.MELTDOWN_ESAMIR:
            case MetagameEventType.MELTDOWN_HOSSIN:
            case MetagameEventType.MELTDOWN_INDAR:
                return 3600000; // 3600 seconds
            case MetagameEventType.MELTDOWN_UNSTABLE_AMERISH:
            case MetagameEventType.MELTDOWN_UNSTABLE_ESAMIR:
            case MetagameEventType.MELTDOWN_UNSTABLE_HOSSIN:
            case MetagameEventType.MELTDOWN_UNSTABLE_INDAR:
                return 1800000; // 1800 seconds
        }

        throw new ApplicationException('Unable to calculate duration!', 'PS2AlertsMetagameInstance');
    }
}
