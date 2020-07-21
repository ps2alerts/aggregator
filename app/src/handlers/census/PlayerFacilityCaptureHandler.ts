import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import {TYPES} from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import PlayerFacilityCaptureEvent from './events/PlayerFacilityCaptureEvent';

@injectable()
export default class PlayerFacilityCaptureHandler implements EventHandlerInterface<PlayerFacilityCaptureEvent> {
    private static readonly logger = getLogger('PlayerFacilityCaptureHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
    }

    public async handle(event: PlayerFacilityCaptureEvent): Promise<boolean>{
        PlayerFacilityCaptureHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            PlayerFacilityCaptureHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            await Promise.all([
                this.playerHandler.updateLastSeen(event.worldId, event.characterId),
                this.storeEvent(event),
            ]);
        } catch (e) {
            if (e instanceof Error) {
                PlayerFacilityCaptureHandler.logger.error(`Error parsing PlayerFacilityCapture: ${e.message}\r\n${jsonLogOutput(event)}`);
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
