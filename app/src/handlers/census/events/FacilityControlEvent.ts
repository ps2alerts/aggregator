/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "timestamp":"",
 "world_id":"",
 "old_faction_id":"",
 "outfit_id":"",
 "new_faction_id":"",
 "facility_id":"",
 "duration_held":"",
 "zone_id":""
 * ### END ###
 **/

import {injectable} from 'inversify';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import Parser from '../../../utils/parser';
import ZoneUtils from '../../../utils/ZoneUtils';
import {Zone} from '../../../constants/zone';
import FactionUtils from '../../../utils/FactionUtils';
import {Faction} from '../../../constants/faction';
import {FacilityControl, PS2Event} from 'ps2census';

@injectable()
export default class FacilityControlEvent {
    public readonly worldId: number;

    public readonly zone: Zone;

    public readonly timestamp: number;

    public readonly facilityId: number;

    public readonly outfitId: number;

    public readonly durationHeld: number;

    public readonly oldFaction: Faction;

    public readonly newFaction: Faction;

    constructor(
        event: PS2Event,
    ) {
        const facilityControl = event as FacilityControl;
        this.worldId = Parser.parseArgumentAsNumber(facilityControl.world_id);

        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id', 'FacilityControlEvent');
        }

        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseArgumentAsNumber(facilityControl.zone_id));
        this.timestamp = Parser.parseArgumentAsNumber(facilityControl.timestamp);

        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp', 'FacilityControlEvent');
        }

        this.facilityId = Parser.parseArgumentAsNumber(facilityControl.facility_id);

        if (isNaN(this.facilityId)) {
            throw new IllegalArgumentException('facility_id', 'FacilityControlEvent');
        }

        this.outfitId = Parser.parseArgumentAsNumber(facilityControl.outfit_id);

        if (isNaN(this.outfitId)) {
            throw new IllegalArgumentException('outfit_id', 'FacilityControlEvent');
        }

        this.durationHeld = Parser.parseArgumentAsNumber(facilityControl.duration_held);

        if (isNaN(this.durationHeld)) {
            throw new IllegalArgumentException('durationHeld', 'FacilityControlEvent');
        }

        this.oldFaction = FactionUtils.parse(Parser.parseArgumentAsNumber(facilityControl.old_faction_id));
        this.newFaction = FactionUtils.parse(Parser.parseArgumentAsNumber(facilityControl.new_faction_id));
    }

}
