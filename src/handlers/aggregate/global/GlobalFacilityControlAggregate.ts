import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import FactionUtils from '../../../utils/FactionUtils';
import FacilityControlEvent from '../../census/events/FacilityControlEvent';
import {MQAcceptedPatterns} from '../../../constants/MQAcceptedPatterns';
import ApiMQDelayPublisher from '../../../services/rabbitmq/publishers/ApiMQDelayPublisher';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import {calculateRemainingTime} from '../../../utils/InstanceRemainingTime';

@injectable()
export default class GlobalFacilityControlAggregate implements AggregateHandlerInterface<FacilityControlEvent> {
    private static readonly logger = getLogger('GlobalFacilityControlAggregate');
    private readonly apiMQPublisher: ApiMQDelayPublisher;

    constructor(@inject(TYPES.apiMQDelayPublisher) apiMQPublisher: ApiMQDelayPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: FacilityControlEvent): Promise<boolean> {
        GlobalFacilityControlAggregate.logger.silly('GlobalFacilityControlAggregate.handle');

        const documents = [];

        if (event.isDefence) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const defenceKey = `${FactionUtils.parseFactionIdToShortName(event.newFaction)}.defences`;
            documents.push(
                {$inc: {[defenceKey]: 1}},
                {$inc: {['totals.defences']: 1}},
            );
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const captureKey = `${FactionUtils.parseFactionIdToShortName(event.newFaction)}.captures`;
            documents.push(
                {$inc: {[captureKey]: 1}},
                {$inc: {['totals.captures']: 1}},
            );
        }

        try {
            await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                MQAcceptedPatterns.GLOBAL_FACILITY_CONTROL_AGGREGATE,
                event.instance.instanceId,
                documents,
                [{
                    world: event.instance.world,
                    facility: event.facility,
                }],
            ), calculateRemainingTime(event.instance) + 30000);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            GlobalFacilityControlAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
        }

        return true;
    }
}
