/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "event_name":"",
 "timestamp":"",
 "world_id":"",
 "zone_id":"",
 "triggering_faction":"",
 "previous_faction":"",
 "vs_population":"",
 "nc_population":"",
 "tr_population":"",
 "metagame_event_id":"",
 "event_type":""
 * ### END ###
 **/

import { injectable } from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import { GenericEvent } from 'ps2census/dist/client/utils/PS2Events';
import { getLogger } from '../../logger';
import config from '../../config';
import { jsonLogOutput } from '../../utils/json';
import ContinentLockEvent from './events/ContinentLockEvent';


@injectable()
export default class ContinentLockHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('ContinentLockHandler');

    public handle(event: GenericEvent): boolean {
        ContinentLockHandler.logger.debug('Parsing message...');
        if (config.features.logging.censusEventContent) {
            ContinentLockHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }
        try {
            const continentLockEvent = new ContinentLockEvent(event);
            return true;
        } catch (e) {
            ContinentLockHandler.logger.warn('Error parsing ContinentLockEvent: ' + e.message + '\r\n' + jsonLogOutput(event));
            return false;
        }
    }
}
