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
import {World} from '../../../constants/world';
import {Loadout} from '../../../constants/loadout';

@injectable()
export default class GainExperienceEvent {
    public readonly world: World;
    public readonly zone: Zone;
    public readonly timestamp: number;
    public readonly characterId: string;
    public readonly experienceId: number;
    public readonly loadout: Loadout;
    public readonly amount: number;

    constructor(
        event: PS2Event,
    ) {
        if (!(event instanceof GainExperience)) {
            throw new IllegalArgumentException('event', 'GainExperienceEvent');
        }

        this.world = Parser.parseNumericalArgument(event.world_id);

        if (isNaN(this.world)) {
            throw new IllegalArgumentException('world_id');
        }

        this.zone = ZoneUtils.parse(Parser.parseNumericalArgument(event.zone_id));

        if (isNaN(this.zone)) {
            throw new IllegalArgumentException('zone_id');
        }

        this.timestamp = Parser.parseNumericalArgument(event.timestamp);

        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp');
        }

        this.characterId = event.character_id; // This is a string on purpose

        this.experienceId = Parser.parseNumericalArgument(event.experience_id);

        if (isNaN(this.experienceId)) {
            throw new IllegalArgumentException('experience_id');
        }

        this.loadout = Parser.parseNumericalArgument(event.loadout_id);

        if (isNaN(this.loadout)) {
            throw new IllegalArgumentException('loadout_id');
        }

        this.amount = Parser.parseNumericalArgument(event.amount);

        if (isNaN(this.amount)) {
            throw new IllegalArgumentException('amount');
        }
        // I don't think we need the other_id for anything
    }
}
