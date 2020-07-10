/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "character_id":"",
 "event_name":"PlayerLogin",
 "timestamp":"",
 "world_id":""
 * ### END ###
 **/

import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {GenericEvent} from 'ps2census/dist/client/utils/PS2Events';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import PlayerLoginEvent from './events/PlayerLoginEvent';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import {TYPES} from '../../constants/types';

@injectable()
export default class PlayerLoginEventHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('PlayerLoginEventHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
    }

    public handle(event: GenericEvent): boolean {
        PlayerLoginEventHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            PlayerLoginEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            const playerLogin = new PlayerLoginEvent(event);
            this.playerHandler.handleLogin(playerLogin);
        } catch (e) {
            PlayerLoginEventHandler.logger.warn(`Error parsing FacilityControlEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
            return false;
        }

        return true;
    }
}
