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
    public readonly characterId: string;
    public readonly experienceId: number;
    public readonly loadoutId: number;
    public readonly amount: number;

    constructor(
        event: PS2Event,
    ) {
        if (!(event instanceof GainExperience)) {
            throw new IllegalArgumentException('event', 'GainExperienceEvent');
        }

        this.worldId = Parser.parseNumericalArgument(event.world_id);

        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id');
        }

        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseNumericalArgument(event.zone_id));
        this.timestamp = Parser.parseNumericalArgument(event.timestamp);

        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp');
        }

        this.characterId = event.character_id; // This is a string on purpose

        this.experienceId = Parser.parseNumericalArgument(event.experience_id);

        if (isNaN(this.experienceId)) {
            throw new IllegalArgumentException('experience_id');
        }

        this.loadoutId = Parser.parseNumericalArgument(event.loadout_id);

        if (isNaN(this.loadoutId)) {
            throw new IllegalArgumentException('loadout_id');
        }

        this.amount = Parser.parseNumericalArgument(event.amount);

        if (isNaN(this.amount)) {
            throw new IllegalArgumentException('amount');
        }
        // I don't think we need the other_id for anything
    }
}
