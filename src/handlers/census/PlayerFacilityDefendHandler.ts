import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import {TYPES} from '../../constants/types';
import CharacterPresenceHandlerInterface from '../../interfaces/CharacterPresenceHandlerInterface';
import PlayerFacilityDefendEvent from './events/PlayerFacilityDefendEvent';

@injectable()
export default class PlayerFacilityDefendHandler implements EventHandlerInterface<PlayerFacilityDefendEvent> {
    private static readonly logger = getLogger('PlayerFacilityDefendHandler');

    private readonly characterPresenceHandler: CharacterPresenceHandlerInterface;

    constructor(@inject(TYPES.characterPresenceHandlerInterface) characterPresenceHandler: CharacterPresenceHandlerInterface) {
        this.characterPresenceHandler = characterPresenceHandler;
    }

    public async handle(event: PlayerFacilityDefendEvent): Promise<boolean>{
        PlayerFacilityDefendHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            PlayerFacilityDefendHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            await Promise.all([
                this.characterPresenceHandler.update(event.character, event.zone),
                this.storeEvent(event),
            ]);
        } catch (e) {
            if (e instanceof Error) {
                PlayerFacilityDefendHandler.logger.error(`Error parsing PlayerFacilityDefend: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                PlayerFacilityDefendHandler.logger.error('UNEXPECTED ERROR parsing PlayerFacilityDefend!');
            }

            return false;
        }

        return true;
    }

    // WIP
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await
    private async storeEvent(playerFacilityDefendEvent: PlayerFacilityDefendEvent): Promise<boolean> {
        return true;
        // TODO Save to database
    }
}
