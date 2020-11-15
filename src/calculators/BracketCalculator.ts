import {CalculatorInterface} from './CalculatorInterface';
import {injectable} from 'inversify';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {getLogger} from '../logger';
import {Bracket} from '../constants/bracket';
import {World} from '../constants/world';
import moment from 'moment-timezone';
import {Moment} from 'moment';

@injectable()
export default class BracketCalculator implements CalculatorInterface<Bracket> {
    private static readonly logger = getLogger('TerritoryCalculator');
    private readonly instance: MetagameTerritoryInstance;

    constructor(instance: MetagameTerritoryInstance) {
        this.instance = instance;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async calculate(): Promise<Bracket> {
        BracketCalculator.logger.debug('Running Bracket calculator');

        const world = this.instance.world;
        const utcDate = new Date(this.instance.timeStarted.toISOString());

        let time: Moment;

        switch (world) {
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
                BracketCalculator.logger.debug(`[${this.instance.instanceId}] Jaeger instance detected, setting bracket to NONE`);
                return Bracket.NONE; // Jaeger shouldn't have brackets as it makes no sense for it to do so.
        }

        BracketCalculator.logger.debug(`[${this.instance.instanceId}] Local server hour is ${time.hour()}`);
        BracketCalculator.logger.debug(`[${this.instance.instanceId}] Is DST? ${time.isDST() ? 'yes' : 'no'}`);

        const bracket = this.calculateBracket(time.hour());

        BracketCalculator.logger.debug(`[${this.instance.instanceId}] Bracket is ${bracket}`);

        return bracket;
    }

    private calculateBracket(hour: number): Bracket {
        let bracket = Bracket.NONE;

        if (hour >= 0 && hour < 12) {
            bracket = Bracket.MORNING;
        } else if (hour >= 12 && hour < 17) {
            bracket = Bracket.AFTERNOON;
        } else if (hour >= 17 && hour < 24) {
            bracket = Bracket.PRIME;
        }

        return bracket;
    }
}
