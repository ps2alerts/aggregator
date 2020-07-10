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
import {GenericEvent} from '../../../types/censusEventTypes';
import {AchievementEarned} from 'ps2census/dist/client/utils/PS2Events';
import Parser from '../../../utils/parser';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import ZoneUtils from '../../../utils/ZoneUtils';
import {Zone} from '../../../constants/zone';

@injectable()
export default class AchievementEarnedEvent {
    public readonly worldId: number;
    public readonly characterId: number;
    public readonly zone: Zone;
    public readonly achievementId: number;
    public readonly timestamp: number;

    constructor(
        event: GenericEvent,
    ) {
        const achievementEarnedEvent = event as AchievementEarned;
        this.worldId = Parser.parseArgumentAsNumber(achievementEarnedEvent.world_id);

        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id', 'AchievementEarnedEvent');
        }

        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseArgumentAsNumber(achievementEarnedEvent.zone_id));
        this.characterId = Parser.parseArgumentAsNumber(achievementEarnedEvent.character_id);

        if (isNaN(this.characterId)) {
            throw new IllegalArgumentException('character_id', 'AchievementEarnedEvent');
        }

        this.achievementId = Parser.parseArgumentAsNumber(achievementEarnedEvent.achievement_id);

        if (isNaN(this.achievementId)) {
            throw new IllegalArgumentException('achievement_id', 'AchievementEarnedEvent');
        }

        this.timestamp = Parser.parseArgumentAsNumber(achievementEarnedEvent.timestamp);

        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp', 'AchievementEarnedEvent');
        }
    }
}
