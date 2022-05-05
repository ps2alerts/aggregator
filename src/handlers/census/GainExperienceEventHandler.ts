import {injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import GainExperienceEvent from './events/GainExperienceEvent';
import CharacterPresenceHandler from '../CharacterPresenceHandler';

@injectable()
export default class GainExperienceEventHandler implements EventHandlerInterface<GainExperienceEvent> {
    private static readonly logger = getLogger('GainExperienceHandler');

    constructor(private readonly characterPresenceHandler: CharacterPresenceHandler) {}

    public async handle(event: GainExperienceEvent): Promise<boolean>{
        GainExperienceEventHandler.logger.silly('Parsing message...');

        if (config.features.logging.censusEventContent) {
            GainExperienceEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            await Promise.all([
                this.characterPresenceHandler.update(event.character, event.zone),
                // We will never store this event. We're not lunatics. We *might* aggregate it later.
            ]);
        } catch (e) {
            if (e instanceof Error) {
                GainExperienceEventHandler.logger.error(`Error parsing GainExperienceEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                GainExperienceEventHandler.logger.error('UNEXPECTED ERROR parsing GainExperienceEvent!');
            }

            return false;
        }

        return true;
    }
}
