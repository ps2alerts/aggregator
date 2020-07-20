import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import {TYPES} from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import PlayerFacilityCaptureEvent from './events/PlayerFacilityCaptureEvent';
import {PS2Event} from 'ps2census';

@injectable()
export default class PlayerFacilityCaptureHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('PlayerFacilityCaptureHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
    }

    public async handle(event: PS2Event): Promise<boolean>{
        PlayerFacilityCaptureHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            PlayerFacilityCaptureHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            const playerFacilityCaptureEvent = new PlayerFacilityCaptureEvent(event);
            await Promise.all([
                this.playerHandler.updateLastSeen(playerFacilityCaptureEvent.worldId, playerFacilityCaptureEvent.characterId),
                this.storeEvent(playerFacilityCaptureEvent),
            ]);
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

    // WIP
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await
    private async storeEvent(playerFacilityCaptureEvent: PlayerFacilityCaptureEvent): Promise<boolean> {
        return true;
        // TODO Save to database
    }
}
