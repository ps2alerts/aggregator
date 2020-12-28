import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import {MQAcceptedPatterns} from '../../../constants/MQAcceptedPatterns';
import MetagameTerritoryInstance from '../../../instances/MetagameTerritoryInstance';
import {Faction} from '../../../constants/faction';
import ApplicationException from '../../../exceptions/ApplicationException';
import {calculateRemainingTime} from '../../../utils/InstanceRemainingTime';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import ApiMQDelayPublisher from '../../../services/rabbitmq/publishers/ApiMQDelayPublisher';

@injectable()
export default class GlobalVictoryAggregate implements AggregateHandlerInterface<MetagameTerritoryInstance> {
    private static readonly logger = getLogger('GlobalVictoryAggregate');
    private readonly apiMQPublisher: ApiMQDelayPublisher;

    constructor(@inject(TYPES.apiMQDelayPublisher) apiMQPublisher: ApiMQDelayPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: MetagameTerritoryInstance): Promise<boolean> {
        GlobalVictoryAggregate.logger.debug('GlobalVictoryAggregate.handle');

        const docs = [];

        switch (event.result?.victor) {
            case Faction.NONE:
                docs.push({$inc: {draws: 1}});
                break;
            case Faction.VANU_SOVEREIGNTY:
                docs.push({$inc: {vs: 1}});
                break;
            case Faction.NEW_CONGLOMERATE:
                docs.push({$inc: {nc: 1}});
                break;
            case Faction.TERRAN_REPUBLIC:
                docs.push({$inc: {tr: 1}});
                break;
            default:
                throw new ApplicationException(`[${event.instanceId} undetermined victor path`, 'GlobalVictoryAggregate');
        }

        try {
            await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                MQAcceptedPatterns.GLOBAL_VICTORY_AGGREGATE,
                event.instanceId,
                docs,
                [{
                    world: event.world,
                    zone: event.zone,
                }],
            ), calculateRemainingTime(event) + 30000);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            GlobalVictoryAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
        }

        return true;
    }
}
