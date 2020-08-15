import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import {jsonLogOutput} from '../../utils/json';
import PlayerLoginEvent from './events/PlayerLoginEvent';
import CharacterPresenceHandlerInterface from '../../interfaces/CharacterPresenceHandlerInterface';
import {TYPES} from '../../constants/types';

@injectable()
export default class PlayerLoginEventHandler implements EventHandlerInterface<PlayerLoginEvent> {
    private static readonly logger = getLogger('PlayerLoginEventHandler');

    private readonly characterPresenceHandler: CharacterPresenceHandlerInterface;

    constructor(@inject(TYPES.characterPresenceHandlerInterface) characterPresenceHandler: CharacterPresenceHandlerInterface) {
        this.characterPresenceHandler = characterPresenceHandler;
    }

    public async handle(event: PlayerLoginEvent): Promise<boolean> {
        PlayerLoginEventHandler.logger.silly(jsonLogOutput(event), {message: 'eventData'});

        try {
            await this.characterPresenceHandler.update(event.character, null);
        } catch (e) {
            if (e instanceof Error) {
                PlayerLoginEventHandler.logger.error(`Error parsing PlayerLoginEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                PlayerLoginEventHandler.logger.error('UNEXPECTED ERROR parsing PlayerLoginEvent!');
            }

            return false;
        }

        return true;
    }
}
