import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import PlayerLogoutEvent from './events/PlayerLogoutEvent';
import CharacterPresenceHandlerInterface from '../../interfaces/CharacterPresenceHandlerInterface';
import {TYPES} from '../../constants/types';
import {TestCharacters} from '../../constants/testCharacters';

@injectable()
export default class PlayerLogoutEventHandler implements EventHandlerInterface<PlayerLogoutEvent> {
    private static readonly logger = getLogger('PlayerLogoutEventHandler');

    private readonly characterPresenceHandler: CharacterPresenceHandlerInterface;

    constructor(@inject(TYPES.characterPresenceHandlerInterface) characterPresenceHandler: CharacterPresenceHandlerInterface) {
        this.characterPresenceHandler = characterPresenceHandler;
    }

    public async handle(event: PlayerLogoutEvent): Promise<boolean> {
        if (config.features.logging.censusEventContent && event.characterId === TestCharacters.MAELSTROME26) {
            PlayerLogoutEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            await this.characterPresenceHandler.delete(event.characterId);
        } catch (e) {
            if (e instanceof Error) {
                PlayerLogoutEventHandler.logger.error(`Error parsing PlayerLogoutEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                PlayerLogoutEventHandler.logger.error('UNEXPECTED ERROR parsing PlayerLogoutEvent!');
            }

            return false;
        }

        return true;
    }
}
