import {injectable} from 'inversify';
import {GenericEvent} from '../../../types/censusEventTypes';
import {GainExperience} from 'ps2census/dist/client/utils/PS2Events';
import Parser from '../../../utils/parser';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import ZoneUtils from '../../../utils/ZoneUtils';
import {Zone} from '../../../constants/zone';

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
        event: GenericEvent,
    ) {
        const gainExperienceEvent = event as GainExperience;
        this.worldId = Parser.parseArgumentAsNumber(gainExperienceEvent.world_id);

        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id');
        }

        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseArgumentAsNumber(gainExperienceEvent.zone_id));
        this.timestamp = Parser.parseArgumentAsNumber(gainExperienceEvent.timestamp);

        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp');
        }

        this.characterId = Parser.parseArgumentAsNumber(gainExperienceEvent.character_id);

        if (isNaN(this.characterId)) {
            throw new IllegalArgumentException('character_id');
        }

        this.experienceId = Parser.parseArgumentAsNumber(gainExperienceEvent.experience_id);

        if (isNaN(this.experienceId)) {
            throw new IllegalArgumentException('experience_id');
        }

        this.loadoutId = Parser.parseArgumentAsNumber(gainExperienceEvent.loadout_id);

        if (isNaN(this.loadoutId)) {
            throw new IllegalArgumentException('loadout_id');
        }

        this.amount = Parser.parseArgumentAsNumber(gainExperienceEvent.amount);

        if (isNaN(this.amount)) {
            throw new IllegalArgumentException('amount');
        }
        // I don't think we need the other_id for anything
    }
}
