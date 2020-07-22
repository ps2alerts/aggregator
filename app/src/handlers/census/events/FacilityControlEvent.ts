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
import FactionUtils from '../../../utils/FactionUtils';
import {Faction} from '../../../constants/faction';
import {FacilityControl, PS2EventData} from 'ps2census';
import ActiveAlertInterface from '../../../interfaces/ActiveAlertInterface';

@injectable()
export default class FacilityControlEvent {
    public readonly alert: ActiveAlertInterface;

    public readonly facility: number;

    public readonly timestamp: number;

    public readonly oldFaction: Faction;

    public readonly newFaction: Faction;

    public readonly durationHeld: number;

    public readonly isDefence: boolean;

    public readonly outfitCaptured: string|null;

    constructor(
        event: PS2EventData,
        alert: ActiveAlertInterface,
    ) { // No check needed, ZoneUtils will take care of this

        if (!(event instanceof FacilityControl)) {
            throw new IllegalArgumentException('event', 'FacilityControlEvent');
        }

        this.alert = alert;

        this.facility = Parser.parseNumericalArgument(event.facility_id);

        if (isNaN(this.facility)) {
            throw new IllegalArgumentException('facility_id', 'FacilityControlEvent');
        }

        this.timestamp = Parser.parseNumericalArgument(event.timestamp);

        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp', 'FacilityControlEvent');
        }

        this.durationHeld = Parser.parseNumericalArgument(event.duration_held);

        if (isNaN(this.durationHeld)) {
            throw new IllegalArgumentException('durationHeld', 'FacilityControlEvent');
        }

        this.oldFaction = FactionUtils.parse(Parser.parseNumericalArgument(event.old_faction_id));
        this.newFaction = FactionUtils.parse(Parser.parseNumericalArgument(event.new_faction_id));

        this.isDefence = this.oldFaction === this.newFaction;

        this.outfitCaptured = event.outfit_id ? event.outfit_id : null;
    }
}
