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
import {AchievementEarned} from 'ps2census';
import {World} from '../../../constants/world';
import Character from '../../../data/Character';

@injectable()
export default class AchievementEarnedEvent {
    public readonly character: Character;
    public readonly world: World;
    public readonly zone: Zone;
    public readonly achievementId: number;
    public readonly timestamp: Date;

    constructor(event: AchievementEarned, character: Character) {
        this.character = character; // This is a string on purpose

        this.world = Parser.parseNumericalArgument(event.world_id);

        if (isNaN(this.world)) {
            throw new IllegalArgumentException('world_id', 'AchievementEarnedEvent');
        }

        this.zone = ZoneUtils.parse(Parser.parseNumericalArgument(event.zone_id));

        this.achievementId = Parser.parseNumericalArgument(event.achievement_id);

        if (isNaN(this.achievementId)) {
            throw new IllegalArgumentException('achievement_id', 'AchievementEarnedEvent');
        }

        this.timestamp = event.timestamp;
    }
}
