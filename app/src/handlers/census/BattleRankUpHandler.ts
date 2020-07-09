/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "battle_rank":"",
 "character_id":"",
 "event_name":"BattleRankUp",
 "timestamp":"",
 "world_id":"",
 "zone_id":""
 * ### END ###
 **/

import { inject, injectable } from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import { getLogger } from '../../logger';
import { GenericEvent } from 'ps2census/dist/client/utils/PS2Events';
import { TYPES } from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import config from '../../config';
import { jsonLogOutput } from '../../utils/json';
import BattleRankUpEvent from './events/BattleRankUpEvent';

@injectable()
export default class BattleRankUpHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('BattleRankUpHandler');

    constructor(
        @inject(TYPES.PlayerHandlerInterface) private playerHandler: PlayerHandlerInterface
    ) {
    }

    public handle(event: GenericEvent): boolean {
        BattleRankUpHandler.logger.debug('Parsing message...');
        if (config.features.logging.censusEventContent) {
            BattleRankUpHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }
        try {
            const battleRankUpEvent = new BattleRankUpEvent(event);
            this.handleBattleRaunkUp(battleRankUpEvent);
        } catch (e) {
            BattleRankUpHandler.logger.warn('Error parsing BattleRankEvent: ' + e.message + '\r\n' + jsonLogOutput(event));
            return false;
        }
        return true;
    }

    private handleBattleRaunkUp(battleRankUpEvent: BattleRankUpEvent): void {
        // Update last seen
        this.playerHandler.updateLastSeen(battleRankUpEvent.worldId, battleRankUpEvent.characterId);
        this.storeEvent(battleRankUpEvent);
    }

    private storeEvent(battleRankUpEvent: BattleRankUpEvent): void {
        // TODO Store in database
    }
}
