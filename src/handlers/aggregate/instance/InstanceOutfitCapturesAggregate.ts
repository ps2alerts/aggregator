import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {MQAcceptedPatterns} from '../../../constants/MQAcceptedPatterns';
import OutfitParticipantCacheHandler from '../../OutfitParticipantCacheHandler';
import FacilityControlEvent from '../../census/events/FacilityControlEvent';

@injectable()
// Note: This does NOT create a new aggregate, merely adds data to the InstanceOutfitAggregate.
export default class InstanceOutfitCapturesAggregate implements AggregateHandlerInterface<FacilityControlEvent> {
    private static readonly logger = getLogger('InstanceOutfitCapturesAggregate');
    private readonly apiMQPublisher: ApiMQPublisher;
    private readonly outfitParticipantCacheHandler: OutfitParticipantCacheHandler;

    constructor(
    @inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher,
        @inject(TYPES.outfitParticipantCacheHandler) outfitParticipantCacheHandler: OutfitParticipantCacheHandler,
    ) {
        this.apiMQPublisher = apiMQPublisher;
        this.outfitParticipantCacheHandler = outfitParticipantCacheHandler;
    }

    public async handle(event: FacilityControlEvent): Promise<boolean> {
        InstanceOutfitCapturesAggregate.logger.debug('InstanceOutfitCapturesAggregate.handle');

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
                MQAcceptedPatterns.INSTANCE_OUTFIT_AGGREGATE,
                documents,
                [{
                    instance: event.instance.instanceId,
                    'outfit.id': event.outfitCaptured,
                }],
            ));
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            InstanceOutfitCapturesAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
        }

        return true;
    }
}
