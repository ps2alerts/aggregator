/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "character_id":"",
 "event_name":"PlayerFacilityCapture",
 "facility_id":"",
 "outfit_id":"",
 "timestamp":"",
 "world_id":"",
 "zone_id":""
 * ### END ###
 **/

import { inject, injectable } from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import { GenericEvent } from 'ps2census/dist/client/utils/PS2Events';
import { getLogger } from '../../logger';
import config from '../../config';
import { jsonLogOutput } from '../../utils/json';
import { TYPES } from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import PlayerFacilityCaptureEvent from './events/PlayerFacilityCaptureEvent';

@injectable()
export default class PlayerFacilityCaptureHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('PlayerFacilityCaptureHandler');

    constructor(
        @inject(TYPES.PlayerHandlerInterface) private playerHandler: PlayerHandlerInterface
    ) {
    }


    public handle(event: GenericEvent): boolean {
        PlayerFacilityCaptureHandler.logger.debug('Parsing message...');
        if (config.features.logging.censusEventContent) {
            PlayerFacilityCaptureHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }
        try {
            const playerFacilityCaptureEvent = new PlayerFacilityCaptureEvent(event);
            this.handlePlayerFacilityCapture(playerFacilityCaptureEvent);
        } catch (e) {
            PlayerFacilityCaptureHandler.logger.warn('Error parsing PlayerFacilityCaptureEvent: ' + e.message + '\r\n' + jsonLogOutput(event));
            return false;
        }
        return true;
    }

    private handlePlayerFacilityCapture(playerFacilityCaptureEvent: PlayerFacilityCaptureEvent) {
        // Update last seen
        this.playerHandler.updateLastSeen(playerFacilityCaptureEvent.worldId, playerFacilityCaptureEvent.characterId);
        return this.storeEvent(playerFacilityCaptureEvent);
    }

    private storeEvent(playerFacilityCaptureEvent: PlayerFacilityCaptureEvent): void {
        // TODO Save to database
    }
}
