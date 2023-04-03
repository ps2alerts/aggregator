/* eslint-disable @typescript-eslint/naming-convention,@typescript-eslint/no-unsafe-assignment */
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {Injectable, Logger} from '@nestjs/common';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {MqAcceptedPatterns} from '../../../ps2alerts-constants/mqAcceptedPatterns';
import FacilityControlEvent from '../../ps2census/events/FacilityControlEvent';
import ExceptionHandler from '../../system/ExceptionHandler';

@Injectable()
// Note: This does NOT create a new aggregate, merely adds data to the InstanceOutfitAggregate.
export default class InstanceOutfitCapturesAggregate implements AggregateHandlerInterface<FacilityControlEvent> {
    private static readonly logger = new Logger('InstanceOutfitCapturesAggregate');

    constructor(
        private readonly apiMQPublisher: ApiMQPublisher,
    ) {}

    public async handle(event: FacilityControlEvent): Promise<boolean> {
        InstanceOutfitCapturesAggregate.logger.verbose('InstanceOutfitCapturesAggregate.handle');

        // If no outfit was detected or a defence, do nothing here
        if (!event.outfitCaptured || event.isDefence) {
            return true;
        }

        const documents = [];
        documents.push({$inc: {captures: 1}});

        try {
            // This will result in the outfit being added without proper information if they've never made a kill.
            // However, the InstanceOutfitAggregate will fill in the blanks as it's set to keep the outfit constantly
            // updated upon a kill / death.
            await this.apiMQPublisher.send(new ApiMQMessage(
                MqAcceptedPatterns.INSTANCE_OUTFIT_AGGREGATE,
                documents,
                [{
                    instance: event.instance.instanceId,
                    'outfit.id': event.outfitCaptured,
                    ps2AlertsEventType: event.instance.ps2AlertsEventType,
                }],
            ));
        } catch (err) {
            new ExceptionHandler('Could not publish message to API!', err, 'InstanceOutfitCapturesAggregate.handle');
        }

        return true;
    }
}
