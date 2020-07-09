/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "character_id":"",
 "event_name":"PlayerFacilityDefend",
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
import PlayerFacilityDefendEvent from './events/PlayerFacilityDefendEvent';

@injectable()
export default class PlayerFacilityDefendHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('PlayerFacilityDefendHandler');

    constructor(
        @inject(TYPES.PlayerHandlerInterface) private playerHandler: PlayerHandlerInterface
    ) {
    }


    public handle(event: GenericEvent): boolean {
        PlayerFacilityDefendHandler.logger.debug('Parsing message...');
        if (config.features.logging.censusEventContent) {
            PlayerFacilityDefendHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }
        try {
            const playerFacilityDefendEvent = new PlayerFacilityDefendEvent(event);
            this.handlePlayerFacilityDefend(playerFacilityDefendEvent);
        } catch (e) {
            PlayerFacilityDefendHandler.logger.warn('Error parsing PlayerFacilityDefendEvent: ' + e.message + '\r\n' + jsonLogOutput(event));
            return false;
        }
        return true;
    }

    private handlePlayerFacilityDefend(playerFacilityDefendEvent: PlayerFacilityDefendEvent) {
        // Update last seen
        this.playerHandler.updateLastSeen(playerFacilityDefendEvent.worldId, playerFacilityDefendEvent.characterId);
        return this.storeEvent(playerFacilityDefendEvent);
    }

    private storeEvent(playerFacilityDefendEvent: PlayerFacilityDefendEvent): void {
        // TODO Save to database
    }
}
