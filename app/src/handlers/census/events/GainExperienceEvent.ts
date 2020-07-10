/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "amount":"",
 "character_id":"",
 "event_name":"GainExperience",
 "experience_id":"",
 "loadout_id":"",
 "other_id":"",
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
import {GainExperience, PS2Event} from 'ps2census';

@injectable()
export default class GainExperienceEvent {
    public readonly zone: Zone;
    public readonly worldId: number;
    public readonly timestamp: number;
    public readonly characterId: number;
    public readonly experienceId: number;
    public readonly loadoutId: number;
    public readonly amount: number;

    constructor(
        event: PS2Event,
    ) {
        if (!(event instanceof GainExperience)) {
            throw new IllegalArgumentException('event', 'GainExperienceEvent');
        }

        this.worldId = Parser.parseArgumentAsNumber(event.world_id);

        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id');
        }

        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseArgumentAsNumber(event.zone_id));
        this.timestamp = Parser.parseArgumentAsNumber(event.timestamp);

        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp');
        }

        this.characterId = Parser.parseArgumentAsNumber(event.character_id);

        if (isNaN(this.characterId)) {
            throw new IllegalArgumentException('character_id');
        }

        this.experienceId = Parser.parseArgumentAsNumber(event.experience_id);

        if (isNaN(this.experienceId)) {
            throw new IllegalArgumentException('experience_id');
        }

        this.loadoutId = Parser.parseArgumentAsNumber(event.loadout_id);

        if (isNaN(this.loadoutId)) {
            throw new IllegalArgumentException('loadout_id');
        }

        this.amount = Parser.parseArgumentAsNumber(event.amount);

        if (isNaN(this.amount)) {
            throw new IllegalArgumentException('amount');
        }
        // I don't think we need the other_id for anything
    }
}
