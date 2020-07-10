/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "character_id":"",
 "facility_id":"",
 "outfit_id":"",
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
import {PlayerFacilityCapture, PS2Event} from 'ps2census';

@injectable()
export default class PlayerFacilityCaptureEvent {
    public readonly worldId: number;
    public readonly zone: Zone;
    public readonly timestamp: number;
    public readonly characterId: number;
    public readonly facilityId: number;
    public readonly outfitId: number;

    constructor(
        event: PS2Event,
    ) {
        if (!(event instanceof PlayerFacilityCapture)) {
            throw new IllegalArgumentException('event', 'PlayerFacilityCaptureEvent');
        }

        this.worldId = Parser.parseArgumentAsNumber(event.world_id);

        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id', 'PlayerFacilityCaptureEvent');
        }

        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseArgumentAsNumber(event.zone_id));
        this.timestamp = Parser.parseArgumentAsNumber(event.timestamp);

        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp', 'PlayerFacilityCaptureEvent');
        }

        this.characterId = Parser.parseArgumentAsNumber(event.character_id);

        if (isNaN(this.characterId)) {
            throw new IllegalArgumentException('character_id', 'PlayerFacilityCaptureEvent');
        }

        this.facilityId = Parser.parseArgumentAsNumber(event.facility_id);

        if (isNaN(this.facilityId)) {
            throw new IllegalArgumentException('facility_id', 'PlayerFacilityCaptureEvent');
        }

        this.outfitId = Parser.parseArgumentAsNumber(event.outfit_id);

        if (isNaN(this.outfitId)) {
            throw new IllegalArgumentException('outfit_id', 'PlayerFacilityCaptureEvent');
        }
    }
}
