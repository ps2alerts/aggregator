import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {GenericEvent} from 'ps2census/dist/client/utils/PS2Events';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import {TYPES} from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import PlayerFacilityCaptureEvent from './events/PlayerFacilityCaptureEvent';

@injectable()
export default class PlayerFacilityCaptureHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('PlayerFacilityCaptureHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
    }

    public handle(event: GenericEvent): boolean {
        PlayerFacilityCaptureHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            PlayerFacilityCaptureHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            const playerFacilityCaptureEvent = new PlayerFacilityCaptureEvent(event);
            this.handlePlayerFacilityCapture(playerFacilityCaptureEvent);
        } catch (e) {
            if (e instanceof Error) {
                PlayerFacilityCaptureHandler.logger.warn(`Error parsing PlayerFacilityCapture: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                PlayerFacilityCaptureHandler.logger.error('UNEXPECTED ERROR parsing PlayerFacilityCapture!');
            }

            return false;
        }

        return true;
    }

    private handlePlayerFacilityCapture(playerFacilityCaptureEvent: PlayerFacilityCaptureEvent): void {
        // Update last seen
        this.playerHandler.updateLastSeen(playerFacilityCaptureEvent.worldId, playerFacilityCaptureEvent.characterId);
        return this.storeEvent(playerFacilityCaptureEvent);
    }

    // WIP
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private storeEvent(playerFacilityCaptureEvent: PlayerFacilityCaptureEvent): void {
        // TODO Save to database
    }
}
