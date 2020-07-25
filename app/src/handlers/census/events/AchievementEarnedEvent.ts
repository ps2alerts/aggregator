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
import {World} from '../../../constants/world';

@injectable()
export default class AchievementEarnedEvent {
    public readonly characterId: string;
    public readonly world: World;
    public readonly zone: Zone;
    public readonly achievementId: number;
    public readonly timestamp: number;

    constructor(
        event: PS2Event,
    ) {
        if (!(event instanceof AchievementEarned)) {
            throw new IllegalArgumentException('event', 'AchievementEarnedEvent');
        }

        this.characterId = event.character_id; // This is a string on purpose

        this.world = Parser.parseNumericalArgument(event.world_id);

        if (isNaN(this.world)) {
            throw new IllegalArgumentException('world_id', 'AchievementEarnedEvent');

        }

        this.zone = ZoneUtils.parse(Parser.parseNumericalArgument(event.zone_id));

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
