/* eslint-disable @typescript-eslint/naming-convention */
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {getLogger} from '../../../logger';
import {injectable} from 'inversify';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import {MQAcceptedPatterns} from '../../../constants/MQAcceptedPatterns';
import FacilityControlEvent from '../../census/events/FacilityControlEvent';
import ApiMQDelayPublisher from '../../../services/rabbitmq/publishers/ApiMQDelayPublisher';
import {Bracket} from '../../../constants/bracket';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';

@injectable()
// Note: This does NOT create a new aggregate, merely adds data to the GlobalOutfitAggregate.
export default class GlobalOutfitCapturesAggregate implements AggregateHandlerInterface<FacilityControlEvent> {
    private static readonly logger = getLogger('GlobalOutfitCapturesAggregate');

    constructor(
        private readonly apiMQPublisher: ApiMQPublisher,
        private readonly apiMQDelayPublisher: ApiMQDelayPublisher,
    ) {}

    public async handle(event: FacilityControlEvent): Promise<boolean> {
        GlobalOutfitCapturesAggregate.logger.silly('GlobalOutfitCapturesAggregate.handle');

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
                MQAcceptedPatterns.GLOBAL_OUTFIT_AGGREGATE,
                event.instance.instanceId,
                documents,
                [{
                    world: event.instance.world,
                    'outfit.id': event.outfitCaptured,
                }],
            ), event.instance.duration);

            // Total bracket aggregation
            await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                MQAcceptedPatterns.GLOBAL_OUTFIT_AGGREGATE,
                event.instance.instanceId,
                documents,
                [{
                    world: event.instance.world,
                    'outfit.id': event.outfitCaptured,
                }],
                Bracket.TOTAL,
            ));
        } catch (err) {
            if (err instanceof Error) {
                GlobalOutfitCapturesAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        return true;
    }
}
