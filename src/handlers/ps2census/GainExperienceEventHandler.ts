import {Injectable, Logger} from '@nestjs/common';
import CharacterPresenceHandler from '../CharacterPresenceHandler';
import {GainExperience} from 'ps2census';
import GainExperienceEvent from './events/GainExperienceEvent';
import {jsonLogOutput} from '../../utils/json';
import PS2EventQueueMessage from '../messages/PS2EventQueueMessage';
import {PS2EventQueueMessageHandlerInterface} from '../../interfaces/PS2EventQueueMessageHandlerInterface';
import CharacterBroker from '../../brokers/CharacterBroker';

@Injectable()
export default class GainExperienceEventHandler implements PS2EventQueueMessageHandlerInterface<GainExperience> {
    public readonly eventName = 'GainExperience';
    private static readonly logger = new Logger('GainExperienceHandler');

    constructor(
        private readonly characterPresenceHandler: CharacterPresenceHandler,
        private readonly characterBroker: CharacterBroker,
    ) {
    }

    public async handle(event: PS2EventQueueMessage<GainExperience>): Promise<boolean> {
        GainExperienceEventHandler.logger.verbose('Parsing message...');

        GainExperienceEventHandler.logger.verbose(jsonLogOutput(event), {message: 'eventData'});

        const characters = await this.characterBroker.get(event.payload);

        const gainExperienceEvent = new GainExperienceEvent(event, characters.character);

        return await this.characterPresenceHandler.update(gainExperienceEvent.character, gainExperienceEvent.instance);
    }
}
