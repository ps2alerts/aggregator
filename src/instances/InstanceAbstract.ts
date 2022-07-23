import {World} from '../ps2alerts-constants/world';
import TerritoryResultInterface from '../interfaces/TerritoryResultInterface';
import {Ps2alertsEventState} from '../ps2alerts-constants/ps2alertsEventState';
import ApplicationException from '../exceptions/ApplicationException';
import moment from 'moment/moment';
import {PS2Event} from 'ps2census';
import {getLogger} from '../logger';

export default abstract class InstanceAbstract {
    private static readonly logger = getLogger('InstanceAbstract');

    protected constructor(
        public readonly instanceId: string, // 10-12345
        public readonly world: World,
        public readonly timeStarted: Date,
        public readonly timeEnded: Date | null,
        public readonly result: TerritoryResultInterface | null,
        public readonly duration: number, // Stored in Milliseconds
        public state: Ps2alertsEventState,
    ) {}

    public overdue(): boolean {
        // If now in milliseconds is greater than start time + duration
        return Date.now() > (this.timeStarted.getTime() + this.duration);
    }

    public messageOverdue(event: PS2Event): boolean {
        // If facility control, add a limit 5 seconds before the alert end to ensure cont locks don't skew the stats
        if (event.event_name === 'FacilityControl') {
            const deadline = (this.timeStarted.getTime() + this.duration) - 5000;
            const overdue = event.timestamp.getTime() > deadline;

            if (overdue) {
                InstanceAbstract.logger.warn('Facility message received outside of deadline!');
            }

            return overdue;
        }

        // If already ended, check if the message is overdue from the end date
        if (this.state === Ps2alertsEventState.ENDED) {
            if (!this.timeEnded) {
                throw new ApplicationException('No time present when the alert is ended!', 'InstanceAbstract.messageOverdue');
            }

            return event.timestamp.getTime() > this.timeEnded.getTime();
        }

        return false;
    }

    // Returns the current second tick of the alert
    public currentDuration(): number {
        // Return current difference in seconds between start and now
        const nowUnix = moment().unix() * 1000;
        // Holy mother of brackets batman!
        return parseInt(((nowUnix - this.timeStarted.getTime()) / 1000).toFixed(0), 10);
    }
}
