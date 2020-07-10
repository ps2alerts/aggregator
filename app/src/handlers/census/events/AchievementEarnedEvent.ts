/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "character_id":"",
 "timestamp":"",
 "world_id":"",
 "achievement_id":"",
 "zone_id":""
 * ### END ###
 **/

import {injectable} from 'inversify';
import Parser from '../../../utils/parser';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import ZoneUtils from '../../../utils/ZoneUtils';
import {Zone} from '../../../constants/zone';
import {AchievementEarned, PS2Event} from 'ps2census';

@injectable()
export default class AchievementEarnedEvent {
    public readonly worldId: number;
    public readonly characterId: number;
    public readonly zone: Zone;
    public readonly achievementId: number;
    public readonly timestamp: number;

    constructor(
        event: PS2Event,
    ) {
        if (!(event instanceof AchievementEarned)) {
            throw new IllegalArgumentException('event', 'AchievementEarnedEvent');
        }

        this.worldId = Parser.parseArgumentAsNumber(event.world_id);

        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id', 'AchievementEarnedEvent');
        }

        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseArgumentAsNumber(event.zone_id));
        this.characterId = Parser.parseArgumentAsNumber(event.character_id);

        if (isNaN(this.characterId)) {
            throw new IllegalArgumentException('character_id', 'AchievementEarnedEvent');
        }

        this.achievementId = Parser.parseArgumentAsNumber(event.achievement_id);

        if (isNaN(this.achievementId)) {
            throw new IllegalArgumentException('achievement_id', 'AchievementEarnedEvent');
        }

        this.timestamp = Parser.parseArgumentAsNumber(event.timestamp);

        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp', 'AchievementEarnedEvent');
        }
    }
}
