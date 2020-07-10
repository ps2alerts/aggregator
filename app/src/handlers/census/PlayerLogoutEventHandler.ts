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
import {TYPES} from '../../constants/types';

@injectable()
export default class PlayerLogoutEventHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('PlayerLogoutEventHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
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
            if (e instanceof Error) {
                PlayerLogoutEventHandler.logger.warn(`Error parsing PlayerLogoutEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                PlayerLogoutEventHandler.logger.error('UNEXPECTED ERROR parsing PlayerLogoutEvent!');
            }

            return false;
        }

        return true;
    }
}
