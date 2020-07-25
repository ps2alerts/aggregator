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
import {World} from '../../../constants/world';

@injectable()
export default class BattleRankUpEvent {
    public readonly characterId: string;
    public readonly world: World;
    public readonly zone: Zone;
    public readonly timestamp: number;
    public readonly battleRank: number;

    constructor(
        event: PS2Event,
    ) {
        if (!(event instanceof BattleRankUp)) {
            throw new IllegalArgumentException('event', 'BattleRankUpEvent');
        }

        this.characterId = event.character_id; // This is a string on purpose

        this.world = Parser.parseNumericalArgument(event.world_id);

        if (isNaN(this.world)) {
            throw new IllegalArgumentException('world_id', 'BattleRankUpEvent');

        }

        this.zone = ZoneUtils.parse(Parser.parseNumericalArgument(event.zone_id));

        this.timestamp = Parser.parseNumericalArgument(event.timestamp);

        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp', 'BattleRankUpEvent');
        }

        this.battleRank = Parser.parseNumericalArgument(event.battle_rank);

        if (isNaN(this.battleRank)) {
            throw new IllegalArgumentException('battle_rank', 'BattleRankUpEvent');
        }
    }
}
