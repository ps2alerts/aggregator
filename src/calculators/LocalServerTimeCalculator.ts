import {injectable} from 'inversify';
import {getLogger} from '../logger';
import {World} from '../constants/world';
import moment from 'moment-timezone';
import {Moment} from 'moment';

@injectable()
export default class LocalServerTimeCalculator {
    private static readonly logger = getLogger('LocalServerTimeCalculator');

    constructor(
        private readonly world: World,
        private readonly timeStarted: Date,
    ) {}

    // eslint-disable-next-line @typescript-eslint/require-await
    public calculate(): number {
        const utcDate = new Date(this.timeStarted.toISOString());

        let time: Moment;

        switch (this.world) {
            case World.SOLTECH:
                time = moment(utcDate).tz('Asia/Tokyo'); // JST +9
                break;
            case World.MILLER:
            case World.COBALT:
            case World.CERES:
                time = moment(utcDate).tz('Europe/London'); // UTC / BST +0 / +1 DST
                break;
            case World.EMERALD:
                time = moment(utcDate).tz('America/New_York'); // EST -5 / -4 DST
                break;
            case World.GENUDINE:
                time = moment(utcDate).tz('America/Mexico_City'); // CST -6 / -5 DST
                break;
            case World.CONNERY:
                time = moment(utcDate).tz('America/Los_Angeles'); // PST -8 / -7 DST
                break;
            case World.JAEGER:
            default:
                time = moment(utcDate).tz('UTC'); // Jaeger shouldn't have brackets as it makes no sense for it to do so.
        }

        LocalServerTimeCalculator.logger.silly(`Local server hour is ${time.hour()}`);
        LocalServerTimeCalculator.logger.silly(`Is DST? ${time.isDST() ? 'yes' : 'no'}`);

        return time.hour();
    }
}
