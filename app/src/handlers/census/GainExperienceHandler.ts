/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "amount":"",
 "character_id":"",
 "event_name":"GainExperience",
 "experience_id":"",
 "loadout_id":"",
 "other_id":"",
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
import GainExperienceEvent from './events/GainExperienceEvent';

@injectable()
export default class GainExperienceHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('GainExperienceHandler');

    constructor(
        @inject(TYPES.PlayerHandlerInterface) private playerHandler: PlayerHandlerInterface
    ) {
    }


    public handle(event: GenericEvent): boolean {
        GainExperienceHandler.logger.debug('Parsing message...');
        if (config.features.logging.censusEventContent) {
            GainExperienceHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }
        try {
            const gainExperienceEvent = new GainExperienceEvent(event);
            this.handleExperienceEvent(gainExperienceEvent);
        } catch (e) {
            GainExperienceHandler.logger.warn('Error parsing GainExperienceEvent: ' + e.message + '\r\n' + jsonLogOutput(event));
            return false;
        }
        return true;
    }

    private handleExperienceEvent(gainExperienceEvent: GainExperienceEvent) {
        // Update last seen
        this.playerHandler.handleExperienceEvent(gainExperienceEvent);
        return this.storeEvent(gainExperienceEvent);
    }

    private storeEvent(gainExperienceEvent: GainExperienceEvent): void {
        // TODO Save to database
    }
}
