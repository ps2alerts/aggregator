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

    constructor(@inject(TYPES.apiMQPublisher) private readonly apiMQPublisher: ApiMQPublisher) {}

    public async handle(event: FacilityControlEvent): Promise<boolean> {
        InstanceFacilityControlAggregate.logger.silly('InstanceFacilityControlAggregate.handle');

        const newFactionName = FactionUtils.parseFactionIdToShortName(event.newFaction);
        const oldFactionName = FactionUtils.parseFactionIdToShortName(event.oldFaction);

        const documents = [];

        documents.push({$setOnInsert: {
            facility: event.facility,
        }});

        if (event.isDefence) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const defenceKey = `${newFactionName}.defences`;
            documents.push(
                {$inc: {[defenceKey]: 1}},
                {$inc: {['totals.defences']: 1}},
            );
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const captureKey = `${newFactionName}.captures`;
            const captureTakenKey = `${newFactionName}.takenFrom.${oldFactionName}`;
            const captureLostKey = `${oldFactionName}.lostTo.${newFactionName}`;
            documents.push(
                {$inc: {[captureKey]: 1}},
                {$inc: {[captureTakenKey]: 1}},
                {$inc: {[captureLostKey]: 1}},
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
            if (err instanceof Error) {
                InstanceFacilityControlAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        return true;
    }
}
