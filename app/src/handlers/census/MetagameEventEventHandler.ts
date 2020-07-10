/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "event_name":"MetagameEvent",
 "experience_bonus":"",
 "faction_nc":"",
 "faction_tr":"",
 "faction_vs":"",
 "metagame_event_id":"",
 "metagame_event_state":"",
 "timestamp":"",
 "world_id":"",
 "zone_id":""
 * ### END ###
 **/

import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {GenericEvent} from 'ps2census/dist/client/utils/PS2Events';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import MetagameEventEvent from './events/MetagameEventEvent';
import {TYPES} from '../../constants/types';
import AlertHandlerInterface from '../../interfaces/AlertHandlerInterface';

@injectable()
export default class MetagameEventEventHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('MetagameEventEventHandler');

    private readonly alertHandler: AlertHandlerInterface;

    constructor(@inject(TYPES.alertHandlerInterface) alertHandler: AlertHandlerInterface) {
        this.alertHandler = alertHandler;
    }

    public handle(event: GenericEvent): boolean {
        MetagameEventEventHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            MetagameEventEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            const mge = new MetagameEventEvent(event);
            return this.alertHandler.handleMetagameEvent(mge);
        } catch (e) {
            MetagameEventEventHandler.logger.warn(`Error parsing MetagameEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
            return false;
        }
    }
}
