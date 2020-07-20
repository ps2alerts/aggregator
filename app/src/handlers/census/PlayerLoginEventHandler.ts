import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import PlayerLoginEvent from './events/PlayerLoginEvent';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import {TYPES} from '../../constants/types';
import {PS2Event} from 'ps2census';

@injectable()
export default class PlayerLoginEventHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('PlayerLoginEventHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
    }

    public async handle(event: PS2Event): Promise<boolean> {
        PlayerLoginEventHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            PlayerLoginEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            const playerLogin = new PlayerLoginEvent(event);
            await this.playerHandler.handleLogin(playerLogin);
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
