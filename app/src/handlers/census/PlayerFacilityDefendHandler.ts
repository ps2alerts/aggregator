import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import {TYPES} from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import PlayerFacilityDefendEvent from './events/PlayerFacilityDefendEvent';
import {PS2Event} from 'ps2census';

@injectable()
export default class PlayerFacilityDefendHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('PlayerFacilityDefendHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
    }

    public async handle(event: PS2Event): Promise<boolean>{
        PlayerFacilityDefendHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            PlayerFacilityDefendHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            const playerFacilityDefendEvent = new PlayerFacilityDefendEvent(event);
            await Promise.all([
                this.playerHandler.updateLastSeen(playerFacilityDefendEvent.worldId, playerFacilityDefendEvent.characterId),
                this.storeEvent(playerFacilityDefendEvent),
            ]);
        } catch (e) {
            if (e instanceof Error) {
                PlayerFacilityDefendHandler.logger.warn(`Error parsing PlayerFacilityDefend: ${e.message}\r\n${jsonLogOutput(event)}`);
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
