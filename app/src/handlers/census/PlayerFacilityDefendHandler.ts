import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {GenericEvent} from 'ps2census/dist/client/utils/PS2Events';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import {TYPES} from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import PlayerFacilityDefendEvent from './events/PlayerFacilityDefendEvent';

@injectable()
export default class PlayerFacilityDefendHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('PlayerFacilityDefendHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
    }

    public handle(event: GenericEvent): boolean {
        PlayerFacilityDefendHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            PlayerFacilityDefendHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            const playerFacilityDefendEvent = new PlayerFacilityDefendEvent(event);
            this.handlePlayerFacilityDefend(playerFacilityDefendEvent);
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

    private handlePlayerFacilityDefend(playerFacilityDefendEvent: PlayerFacilityDefendEvent): void {
        // Update last seen
        this.playerHandler.updateLastSeen(playerFacilityDefendEvent.worldId, playerFacilityDefendEvent.characterId);
        return this.storeEvent(playerFacilityDefendEvent);
    }

    // WIP
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private storeEvent(playerFacilityDefendEvent: PlayerFacilityDefendEvent): void {
        // TODO Save to database
    }
}
