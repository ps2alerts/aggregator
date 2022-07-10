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
import FactionUtils, {FactionName} from '../../../utils/FactionUtils';
import {Faction} from '../../../ps2alerts-constants/faction';
import {FacilityControl} from 'ps2census';
import {FacilityDataInterface} from '../../../interfaces/FacilityDataInterface';
import {MapControlInterface} from '../../../interfaces/MapControlInterface';
import InstanceEvent from './InstanceEvent';
import PS2EventQueueMessage from '../../messages/PS2EventQueueMessage';

@injectable()
export default class FacilityControlEvent extends InstanceEvent {
    public readonly oldFaction: Faction;
    public readonly oldFactionName: FactionName;
    public readonly newFaction: Faction;
    public readonly newFactionName: FactionName;
    public readonly durationHeld: number;
    public readonly isDefence: boolean;
    public readonly outfitCaptured: string | null;
    public readonly mapControl: MapControlInterface | null;

    constructor(
        event: PS2EventQueueMessage<FacilityControl>,
        public readonly facility: FacilityDataInterface,
    ) {
        super(event.payload.timestamp, event.instance);

        this.facility = facility;

        this.durationHeld = Parser.parseNumericalArgument(event.payload.duration_held);

        if (isNaN(this.durationHeld)) {
            throw new IllegalArgumentException('durationHeld', 'FacilityControlEvent');
        }

        this.oldFaction = FactionUtils.parse(Parser.parseNumericalArgument(event.payload.old_faction_id));
        this.newFaction = FactionUtils.parse(Parser.parseNumericalArgument(event.payload.new_faction_id));

        this.newFactionName = FactionUtils.parseFactionIdToShortName(this.newFaction);
        this.oldFactionName = FactionUtils.parseFactionIdToShortName(this.oldFaction);

        this.isDefence = this.oldFaction === this.newFaction;

        this.outfitCaptured = event.payload.outfit_id ? event.payload.outfit_id : null;

        // Used to render capture histories on the website
        this.mapControl = {
            vs: this.instance.result?.vs ?? 0,
            nc: this.instance.result?.nc ?? 0,
            tr: this.instance.result?.tr ?? 0,
            cutoff: this.instance.result?.cutoff ?? 0,
            outOfPlay: this.instance.result?.outOfPlay ?? 0,
        };
    }
}
