import PS2AlertsInstanceAbstract from './PS2AlertsInstanceAbstract';
import {MetagameEventType} from '../constants/metagameEventType';
import {World} from '../constants/world';
import {Zone} from '../constants/zone';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import ApplicationException from '../exceptions/ApplicationException';
import {Ps2alertsEventState} from '../constants/ps2alertsEventState';

export default class PS2AlertsMetagameInstance extends PS2AlertsInstanceAbstract implements PS2AlertsInstanceInterface {
    public readonly zone: Zone;
    public readonly censusInstanceId: number;
    public readonly censusMetagameEventType: MetagameEventType;
    public state: Ps2alertsEventState;

    constructor(
        world: World,
        timeStarted: Date,
        timeEnded: Date | null,
        zone: Zone,
        censusInstanceId: number,
        censusMetagameEventType: MetagameEventType,
        state: Ps2alertsEventState,
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
        // If now in milliseconds is greater th an start time + duration
        return Date.now() > (this.timeStarted.getTime() + this.duration());
    }

    public duration(): number {
        switch (this.censusMetagameEventType) {
            // Current Generation normal alerts
            case MetagameEventType.INDAR_SUPERIORITY:
            case MetagameEventType.INDAR_ENLIGHTENMENT:
            case MetagameEventType.INDAR_LIBERATION:
            case MetagameEventType.ESAMIR_SUPERIORITY:
            case MetagameEventType.ESAMIR_ENLIGHTENMENT:
            case MetagameEventType.ESAMIR_LIBERATION:
            case MetagameEventType.ESAMIR_HOSSIN_SUPERIORITY:
            case MetagameEventType.HOSSIN_ENLIGHTENMENT:
            case MetagameEventType.HOSSIN_LIBERATION:
            case MetagameEventType.AMERISH_SUPERIORITY:
            case MetagameEventType.AMERISH_ENLIGHTENMENT:
            case MetagameEventType.AMERISH_LIBERATION:
                return 3600000; // 3600 seconds
            case MetagameEventType.ESAMIR_UNSTABLE_MELTDOWN:
            case MetagameEventType.HOSSIN_UNSTABLE_MELTDOWN:
            case MetagameEventType.AMERISH_UNSTABLE_MELTDOWN:
            case MetagameEventType.INDAR_UNSTABLE_MELTDOWN:
            case MetagameEventType.ESAMIR_UNSTABLE_MELTDOWN_2:
            case MetagameEventType.HOSSIN_UNSTABLE_MELTDOWN_2:
            case MetagameEventType.AMERISH_UNSTABLE_MELTDOWN_2:
            case MetagameEventType.INDAR_UNSTABLE_MELTDOWN_2:
            case MetagameEventType.ESAMIR_UNSTABLE_MELTDOWN_3:
            case MetagameEventType.HOSSIN_UNSTABLE_MELTDOWN_3:
            case MetagameEventType.AMERISH_UNSTABLE_MELTDOWN_3:
            case MetagameEventType.INDAR_UNSTABLE_MELTDOWN_3:
                return 1800000; // 1800 seconds
        }

        throw new ApplicationException('Unable to calculate duration!', 'PS2AlertsMetagameInstance');
    }
}
