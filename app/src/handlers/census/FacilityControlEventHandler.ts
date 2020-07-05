/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "event_name":"",
 "timestamp":"",
 "world_id":"",
 "old_faction_id":"",
 "outfit_id":"",
 "new_faction_id":"",
 "facility_id":"",
 "duration_held":"",
 "zone_id":""
 * ### END ###
 **/

import { injectable } from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import { GenericEvent } from 'ps2census/dist/client/utils/PS2Events';
import { getLogger } from '../../logger';
import config from '../../config';
import { jsonLogOutput } from '../../utils/json';
import FacilityControlEvent from './events/FacilityControlEvent';


@injectable()
export default class FacilityControlEventHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('FacilityControlEventHandler');

    public handle(event: GenericEvent): boolean {
        FacilityControlEventHandler.logger.debug('Parsing message...');
        if (config.features.logging.censusEventContent) {
            FacilityControlEventHandler.logger.debug(jsonLogOutput(event), { message: 'eventData'});
        }
        try {
            const facilityControl = new FacilityControlEvent(event);
            this.storeEvent(facilityControl);
        } catch (e) {
            FacilityControlEventHandler.logger.warn('Error parsing FacilityControlEvent: ' + e.message + '\r\n' + jsonLogOutput(event));
            return false;
        }
        return true;
    }

    private storeEvent(facilityControl: FacilityControlEvent): void {
        // TODO Store in database
    }
}
