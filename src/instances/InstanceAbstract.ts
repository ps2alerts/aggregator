import {World} from '../ps2alerts-constants/world';
import TerritoryResultInterface from '../interfaces/TerritoryResultInterface';
import {Ps2alertsEventState} from '../ps2alerts-constants/ps2alertsEventState';
import ApplicationException from '../exceptions/ApplicationException';
import moment from 'moment/moment';

export default abstract class InstanceAbstract {
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

    public messageOverdue(timestamp: Date): boolean {
        // If already ended, check if the message is overdue from the end date
        if (this.state === Ps2alertsEventState.ENDED) {
            if (!this.timeEnded) {
                throw new ApplicationException('No time present when the alert is ended!', 'InstanceAbstract.messageOverdue');
            }

            return timestamp.getTime() > this.timeEnded.getTime();
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
