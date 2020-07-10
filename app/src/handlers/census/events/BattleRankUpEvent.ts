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
        if (!(event instanceof BattleRankUp)) {
            throw new IllegalArgumentException('event', 'BattleRankUpEvent');
        }

        this.worldId = Parser.parseArgumentAsNumber(event.world_id);

        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id', 'BattleRankUpEvent');
        }

        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseArgumentAsNumber(event.zone_id));
        this.characterId = Parser.parseArgumentAsNumber(event.character_id);

        if (isNaN(this.characterId)) {
            throw new IllegalArgumentException('character_id', 'BattleRankUpEvent');
        }

        this.timestamp = Parser.parseArgumentAsNumber(event.timestamp);

        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp', 'BattleRankUpEvent');
        }

        this.battleRank = Parser.parseArgumentAsNumber(event.battle_rank);

        if (isNaN(this.battleRank)) {
            throw new IllegalArgumentException('battle_rank', 'BattleRankUpEvent');
        }
    }
}
