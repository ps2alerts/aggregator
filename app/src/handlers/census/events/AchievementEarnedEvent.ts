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
    public readonly characterId: string;
    public readonly zone: Zone;
    public readonly achievementId: number;
    public readonly timestamp: number;

    constructor(
        event: PS2Event,
    ) {
        if (!(event instanceof AchievementEarned)) {
            throw new IllegalArgumentException('event', 'AchievementEarnedEvent');
        }

        this.worldId = Parser.parseNumericalArgument(event.world_id);

        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id', 'AchievementEarnedEvent');
        }

        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseNumericalArgument(event.zone_id));
        this.characterId = event.character_id; // This is a string on purpose

        this.achievementId = Parser.parseNumericalArgument(event.achievement_id);

        if (isNaN(this.achievementId)) {
            throw new IllegalArgumentException('achievement_id', 'AchievementEarnedEvent');
        }

        this.timestamp = Parser.parseNumericalArgument(event.timestamp);

        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp', 'AchievementEarnedEvent');
        }
    }
}
