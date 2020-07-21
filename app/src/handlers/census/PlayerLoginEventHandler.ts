import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import PlayerLoginEvent from './events/PlayerLoginEvent';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import {TYPES} from '../../constants/types';

@injectable()
export default class PlayerLoginEventHandler implements EventHandlerInterface<PlayerLoginEvent> {
    private static readonly logger = getLogger('PlayerLoginEventHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
    }

    public async handle(event: PlayerLoginEvent): Promise<boolean> {
        PlayerLoginEventHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            PlayerLoginEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            await this.playerHandler.handleLogin(event);
        } catch (e) {
            if (e instanceof Error) {
                PlayerLoginEventHandler.logger.error(`Error parsing FacilityControlEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                PlayerLoginEventHandler.logger.error('UNEXPECTED ERROR parsing PlayerLoginEvent!');
            }

            return false;
        }

        return true;
    }
}
