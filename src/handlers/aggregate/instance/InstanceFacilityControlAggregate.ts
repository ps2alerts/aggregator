import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import FacilityControlEvent from '../../census/events/FacilityControlEvent';
import FactionUtils from '../../../utils/FactionUtils';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {MQAcceptedPatterns} from '../../../constants/MQAcceptedPatterns';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';

@injectable()
export default class InstanceFacilityControlAggregate implements AggregateHandlerInterface<FacilityControlEvent> {
    private static readonly logger = getLogger('InstanceFacilityControlAggregate');
    private readonly apiMQPublisher: ApiMQPublisher;

    constructor(@inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: FacilityControlEvent): Promise<boolean> {
        InstanceFacilityControlAggregate.logger.silly('InstanceFacilityControlAggregate.handle');

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
            await this.apiMQPublisher.send(new ApiMQMessage(
                MQAcceptedPatterns.INSTANCE_FACILITY_CONTROL_AGGREGATE,
                documents,
                [{
                    instance: event.instance.instanceId,
                    facility: event.facility,
                }],
            ));
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            InstanceFacilityControlAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
        }

        return true;
    }
}
