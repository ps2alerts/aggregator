import {injectable} from 'inversify';
import {getLogger} from '../../logger';
import CharacterPresenceHandler from '../CharacterPresenceHandler';
import {GainExperience} from 'ps2census';
import GainExperienceEvent from './events/GainExperienceEvent';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import PS2EventQueueMessage from '../messages/PS2EventQueueMessage';
import {PS2EventQueueMessageHandlerInterface} from '../../interfaces/PS2EventQueueMessageHandlerInterface';
import CharacterBroker from '../../brokers/CharacterBroker';

@injectable()
export default class GainExperienceEventHandler implements PS2EventQueueMessageHandlerInterface<GainExperience> {
    public readonly eventName = 'GainExperience';
    private static readonly logger = getLogger('GainExperienceHandler');

    constructor(
        private readonly characterPresenceHandler: CharacterPresenceHandler,
        private readonly characterBroker: CharacterBroker,
        // @multiInject(TYPES.gainExperienceHandlers) private readonly aggregateHandlers: Array<EventHandlerInterface<GainExperienceEvent>>,
    ) {}

    public async handle(event: PS2EventQueueMessage<GainExperience>): Promise<boolean>{
        GainExperienceEventHandler.logger.silly('Parsing message...');

        if (config.features.logging.censusEventContent) {
            GainExperienceEventHandler.logger.silly(jsonLogOutput(event), {message: 'eventData'});
        }

        const characters = await this.characterBroker.get(event.payload);

        const gainExperienceEvent = new GainExperienceEvent(event, characters.character);

        return await this.characterPresenceHandler.update(gainExperienceEvent.character, gainExperienceEvent.instance);
    }
}
