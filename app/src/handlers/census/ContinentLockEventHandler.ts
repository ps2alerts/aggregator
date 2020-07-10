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

import {injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {GenericEvent} from 'ps2census/dist/client/utils/PS2Events';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import ContinentLockEvent from './events/ContinentLockEvent';

@injectable()
export default class ContinentLockEventHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('ContinentLockEventHandler');

    public handle(event: GenericEvent): boolean {
        ContinentLockEventHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            ContinentLockEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            const continentLockEvent = new ContinentLockEvent(event);
            this.storeEvent(continentLockEvent);
            return true;
        } catch (e) {
            if (e instanceof Error) {
                ContinentLockEventHandler.logger.warn(`Error parsing ContinentLockEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                ContinentLockEventHandler.logger.error('UNEXPECTED ERROR parsing ContinentLockEvent!');
            }

            return false;
        }
    }

    // WIP
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private storeEvent(continentLock: ContinentLockEvent): void {
        // TODO Store in database
    }
}
