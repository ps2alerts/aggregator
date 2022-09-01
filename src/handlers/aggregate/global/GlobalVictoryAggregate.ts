/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {getLogger} from '../../../logger';
import {injectable} from 'inversify';
import {MqAcceptedPatterns} from '../../../ps2alerts-constants/mqAcceptedPatterns';
import MetagameTerritoryInstance from '../../../instances/MetagameTerritoryInstance';
import {Faction} from '../../../ps2alerts-constants/faction';
import ApplicationException from '../../../exceptions/ApplicationException';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import moment from 'moment/moment';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import {Bracket} from '../../../ps2alerts-constants/bracket';
import ExceptionHandler from '../../system/ExceptionHandler';

@injectable()
export default class GlobalVictoryAggregate implements AggregateHandlerInterface<MetagameTerritoryInstance> {
    private static readonly logger = getLogger('GlobalVictoryAggregate');

    constructor(
        private readonly apiMQPublisher: ApiMQPublisher,
    ) {}

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
                throw new ApplicationException(`[${event.instanceId}] undetermined victor path!`, 'GlobalVictoryAggregate.handle');
        }

        try {
            await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                MqAcceptedPatterns.GLOBAL_VICTORY_AGGREGATE,
                event.instanceId,
                docs,
                [{
                    world: event.world,
                    zone: event.zone,
                    date: moment().startOf('day').toDate(),
                    ps2AlertsEventType: event.ps2AlertsEventType,
                }],
            ));

            await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                MqAcceptedPatterns.GLOBAL_VICTORY_AGGREGATE,
                event.instanceId,
                docs,
                [{
                    world: event.world,
                    zone: event.zone,
                    date: moment().startOf('day').toDate(),
                    ps2AlertsEventType: event.ps2AlertsEventType,
                }],
                Bracket.TOTAL,
            ));
        } catch (err) {
            new ExceptionHandler('Could not publish message to API!', err, 'GlobalVictoryAggregate.handle');
        }

        return true;
    }
}
