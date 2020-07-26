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
    public readonly characterId: string;
    public readonly timestamp: Date;
    public readonly battleRank: number;

    constructor(
        event: PS2Event,
    ) {
        if (!(event instanceof BattleRankUp)) {
            throw new IllegalArgumentException('event', 'BattleRankUpEvent');
        }

        this.worldId = Parser.parseNumericalArgument(event.world_id);

        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id', 'BattleRankUpEvent');
        }

        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseNumericalArgument(event.zone_id));
        this.characterId = event.character_id; // This is a string on purpose

        // Validation not required
        this.timestamp = event.timestamp;

        this.battleRank = Parser.parseNumericalArgument(event.battle_rank);

        if (isNaN(this.battleRank)) {
            throw new IllegalArgumentException('battle_rank', 'BattleRankUpEvent');
        }
    }
}
