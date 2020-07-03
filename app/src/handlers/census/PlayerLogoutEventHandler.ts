/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "character_id":"",
 "event_name":"PlayerLogout",
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
import PlayerLogoutEvent from './events/PlayerLogoutEvent';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';

@injectable()
export default class PlayerLogoutEventHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('PlayerLogoutEventHandler');

    constructor(@inject('PlayerHandlerInterface') private playerHandler: PlayerHandlerInterface) {
    }

    public handle(event: GenericEvent): boolean {
        PlayerLogoutEventHandler.logger.debug('Parsing message...');
        if (config.features.logging.censusEventContent) {
            PlayerLogoutEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }
        try {
            const playerLogout = new PlayerLogoutEvent(event);
            this.playerHandler.handleLogout(playerLogout);
        } catch (e) {
            PlayerLogoutEventHandler.logger.warn('Error parsing PlayerLogoutEvent: ' + e.message + '\r\n' + jsonLogOutput(event));
            return false;
        }
        return true;
    }
}
