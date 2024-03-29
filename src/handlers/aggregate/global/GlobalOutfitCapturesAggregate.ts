/* eslint-disable @typescript-eslint/naming-convention,@typescript-eslint/no-unsafe-assignment */
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {Injectable, Logger} from '@nestjs/common';
import ApiMQPublisher from '../../../modules/rabbitmq/publishers/ApiMQPublisher';
import {MqAcceptedPatterns} from '../../../ps2alerts-constants/mqAcceptedPatterns';
import FacilityControlEvent from '../../ps2census/events/FacilityControlEvent';
import ApiMQDelayPublisher from '../../../modules/rabbitmq/publishers/ApiMQDelayPublisher';
import {Bracket} from '../../../ps2alerts-constants/bracket';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import ExceptionHandler from '../../system/ExceptionHandler';

@Injectable()
// Note: This does NOT create a new aggregate, merely adds data to the GlobalOutfitAggregate.
export default class GlobalOutfitCapturesAggregate implements AggregateHandlerInterface<FacilityControlEvent> {
    private static readonly logger = new Logger('GlobalOutfitCapturesAggregate');

    constructor(
        private readonly apiMQPublisher: ApiMQPublisher,
        private readonly apiMQDelayPublisher: ApiMQDelayPublisher,
    ) {}

    public async handle(event: FacilityControlEvent): Promise<boolean> {
        GlobalOutfitCapturesAggregate.logger.verbose('GlobalOutfitCapturesAggregate.handle');

        // If no outfit was detected or a defence, do nothing here
        if (!event.outfitCaptured || event.isDefence) {
            return true;
        }

        const documents = [];
        documents.push({$inc: {captures: 1}});

        try {
            // This will result in the outfit being added without proper information if they've never made a kill.
            // However, the GlobalOutfitAggregate will fill in the blanks as it's set to keep the outfit constantly
            // updated upon a kill / death.
            await this.apiMQDelayPublisher.send(new ApiMQGlobalAggregateMessage(
                MqAcceptedPatterns.GLOBAL_OUTFIT_AGGREGATE,
                event.instance.instanceId,
                documents,
                [{
                    world: event.instance.world,
                    'outfit.id': event.outfitCaptured,
                    ps2AlertsEventType: event.instance.ps2AlertsEventType,
                }],
            ), event.instance.duration);

            // Total bracket aggregation
            await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                MqAcceptedPatterns.GLOBAL_OUTFIT_AGGREGATE,
                event.instance.instanceId,
                documents,
                [{
                    world: event.instance.world,
                    'outfit.id': event.outfitCaptured,
                    ps2AlertsEventType: event.instance.ps2AlertsEventType,
                }],
                Bracket.TOTAL,
            ));
        } catch (err) {
            new ExceptionHandler('Could not publish message to API!', err, 'GlobalOutfitCaptures.handle');
        }

        return true;
    }
}
