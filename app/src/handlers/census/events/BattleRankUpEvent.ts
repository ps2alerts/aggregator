/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "battle_rank":"",
 "character_id":"",
 "timestamp":"",
 "world_id":"",
 "zone_id":""
 * ### END ###
 **/

import {injectable} from 'inversify';
import Parser from '../../../utils/parser';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import ZoneUtils from '../../../utils/ZoneUtils';
import {Zone} from '../../../constants/zone';
import {BattleRankUp, PS2Event} from 'ps2census';

@injectable()
export default class BattleRankUpEvent {
    public readonly worldId: number;
    public readonly zone: Zone;
    public readonly characterId: number;
    public readonly timestamp: number;
    public readonly battleRank: number;

    constructor(
        event: PS2Event,
    ) {
        const battleRankUpEvent = event as BattleRankUp;
        this.worldId = Parser.parseArgumentAsNumber(battleRankUpEvent.world_id);

        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id', 'BattleRankUpEvent');
        }

        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseArgumentAsNumber(battleRankUpEvent.zone_id));
        this.characterId = Parser.parseArgumentAsNumber(battleRankUpEvent.character_id);

        if (isNaN(this.characterId)) {
            throw new IllegalArgumentException('character_id', 'BattleRankUpEvent');
        }

        this.timestamp = Parser.parseArgumentAsNumber(battleRankUpEvent.timestamp);

        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp', 'BattleRankUpEvent');
        }

        this.battleRank = Parser.parseArgumentAsNumber(battleRankUpEvent.battle_rank);

        if (isNaN(this.battleRank)) {
            throw new IllegalArgumentException('battle_rank', 'BattleRankUpEvent');
        }
    }
}
