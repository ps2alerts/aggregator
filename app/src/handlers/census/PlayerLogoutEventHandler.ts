import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger, getLogsEnabled} from '../../logger';
import {jsonLogOutput} from '../../utils/json';
import PlayerLogoutEvent from './events/PlayerLogoutEvent';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import {TYPES} from '../../constants/types';

@injectable()
export default class PlayerLogoutEventHandler implements EventHandlerInterface<PlayerLogoutEvent> {
    private static readonly logger = getLogger('PlayerLogoutEventHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
    }

    public async handle(event: PlayerLogoutEvent): Promise<boolean> {
        PlayerLogoutEventHandler.logger.debug('Parsing message...');

        if (getLogsEnabled().censusEventContent.playerFacility) {
            PlayerLogoutEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            await this.playerHandler.handleLogout(event);
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
