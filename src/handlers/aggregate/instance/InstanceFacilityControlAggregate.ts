/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {Injectable, Logger} from '@nestjs/common';
import FacilityControlEvent from '../../ps2census/events/FacilityControlEvent';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {MqAcceptedPatterns} from '../../../ps2alerts-constants/mqAcceptedPatterns';
import ApiMQPublisher from '../../../modules/rabbitmq/publishers/ApiMQPublisher';
import ExceptionHandler from '../../system/ExceptionHandler';

@Injectable()
export default class InstanceFacilityControlAggregate implements AggregateHandlerInterface<FacilityControlEvent> {
    private static readonly logger = new Logger('InstanceFacilityControlAggregate');

    constructor(private readonly apiMQPublisher: ApiMQPublisher) {}

    public async handle(event: FacilityControlEvent): Promise<boolean> {
        InstanceFacilityControlAggregate.logger.verbose('InstanceFacilityControlAggregate.handle');

        const documents = [];

        documents.push({$setOnInsert: {
            facility: event.facility,
            ps2AlertsEventType: event.instance.ps2AlertsEventType,
        }});

        if (event.isDefence) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const defenceKey = `${event.newFactionName}.defences`;
            documents.push(
                {$inc: {[defenceKey]: 1}},
                {$inc: {['totals.defences']: 1}},
            );
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const captureKey = `${event.newFactionName}.captures`;
            const captureTakenKey = `${event.newFactionName}.takenFrom.${event.oldFactionName}`;
            const captureLostKey = `${event.oldFactionName}.lostTo.${event.newFactionName}`;
            documents.push(
                {$inc: {[captureKey]: 1}},
                {$inc: {[captureTakenKey]: 1}},
                {$inc: {[captureLostKey]: 1}},
                {$inc: {['totals.captures']: 1}},
            );
        }

        try {
            await this.apiMQPublisher.send(new ApiMQMessage(
                MqAcceptedPatterns.INSTANCE_FACILITY_CONTROL_AGGREGATE,
                documents,
                [{
                    instance: event.instance.instanceId,
                    facility: event.facility,
                    ps2AlertsEventType: event.instance.ps2AlertsEventType,
                }],
            ));
        } catch (err) {
            new ExceptionHandler('Could not publish message to API!', err, 'InstanceFacilityControlAggregate.handle');
        }

        return true;
    }
}
