import PS2AlertsInstanceAbstract from './PS2AlertsInstanceAbstract';
import {World} from '../constants/world';
import {Zone} from '../constants/zone';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import ApplicationException from '../exceptions/ApplicationException';
import {Ps2alertsEventState} from '../constants/ps2alertsEventState';
import {Ps2alertsEventType} from '../constants/ps2alertsEventType';

export default class PS2AlertsCustomWorldZoneInstance extends PS2AlertsInstanceAbstract implements PS2AlertsInstanceInterface {
    public zone: Zone;
    public eventType: Ps2alertsEventType;
    public eventId: number;
    public state: Ps2alertsEventState;
    // For duration see get duration();
    public description: string;

    constructor(
        world: World,
        timeStarted: Date,
        timeEnded: Date | null,
        zone: Zone,
        eventType: Ps2alertsEventType,
        eventId: number,
        state: Ps2alertsEventState,
        description: string,
    ) {
        super(
            `${world}-${zone}-${eventId}`, // lul
            world,
            timeStarted,
            timeEnded,
        );
        this.zone = zone;
        this.eventType = eventType;
        this.eventId = eventId;
        this.state = state;
        this.description = description;
    }

    public match(world: World, zone: Zone): boolean {
        return world === this.world && zone === this.zone;
    }

    public overdue(): boolean {
        // If now in milliseconds is greater than start time + duration
        return Date.now() > (this.timeStarted.getTime() + this.duration);
    }

    get duration(): number {
        switch (this.eventType) {
            case Ps2alertsEventType.COMMUNITY_EVENT:
            case Ps2alertsEventType.JAEGER_EVENT:
                return 3600000; // 3600 seconds
        }

        throw new ApplicationException('Unable to calculate duration!', 'PS2AlertsCustomWorldZoneInstance');
    }
}
