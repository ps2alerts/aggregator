/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "experience_bonus":"",
 "faction_nc":"",
 "faction_tr":"",
 "faction_vs":"",
 "metagame_event_id":"",
 "metagame_event_state":"",
 "timestamp":"",
 "world_id":"",
 "zone_id":""
 * ### END ###
 **/

import {injectable} from 'inversify';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import EventId from '../../../utils/eventId';
import Parser from '../../../utils/parser';
import {Zone} from '../../../constants/zone';
import ZoneUtils from '../../../utils/ZoneUtils';
import {MetagameEvent} from 'ps2census';
import {MetagameEventState} from '../../../constants/metagameEventState';
import {World} from '../../../constants/world';

@injectable()
export default class MetagameEventEvent {
    public readonly world: World;

    public readonly eventState: MetagameEventState;

    public readonly factionNc: number;

    public readonly factionTr: number;

    public readonly factionVs: number;

    public readonly timestamp: Date;

    public readonly instanceId: number;

    public readonly zone: Zone;

    constructor(
        event: MetagameEvent,
    ) {
        this.world = Parser.parseNumericalArgument(event.world_id);

        if (isNaN(this.world)) {
            throw new IllegalArgumentException('world_id', 'MetagameEventEvent');
        }

        if (event.metagame_event_state_name === null || event.metagame_event_state_name === undefined) {
            throw new IllegalArgumentException('metagame_event_state_name', 'MetagameEventEvent');
        }

        const eventStateName = event.metagame_event_state_name;

        if (eventStateName !== 'started' && eventStateName !== 'ended') {
            throw new IllegalArgumentException('metagame_event_state_name', 'MetagameEventEvent');
        }

        this.eventState = eventStateName === 'started' ? MetagameEventState.STARTED : MetagameEventState.FINISHED;
        this.factionNc = Parser.parseNumericalArgument(event.faction_nc, true);

        if (isNaN(this.factionNc)) {
            throw new IllegalArgumentException('faction_nc', 'MetagameEventEvent');
        }

        this.factionTr = Parser.parseNumericalArgument(event.faction_tr, true);

        if (isNaN(this.factionTr)) {
            throw new IllegalArgumentException('faction_tr', 'MetagameEventEvent');
        }

        this.factionVs = Parser.parseNumericalArgument(event.faction_vs, true);

        if (isNaN(this.factionVs)) {
            throw new IllegalArgumentException('faction_vs', 'MetagameEventEvent');
        }

        this.timestamp = event.timestamp;

        if (this.timestamp === undefined || this.timestamp === null) {
            throw new IllegalArgumentException('timestamp', 'MetagameEventEvent');
        }

        const eventId = Parser.parseNumericalArgument(event.metagame_event_id);

        if (isNaN(eventId)) {
            throw new IllegalArgumentException('metagame_event_id', 'MetagameEventEvent');
        }

        this.instanceId = Parser.parseNumericalArgument(event.instance_id);

        if (isNaN(this.instanceId)) {
            throw new IllegalArgumentException('instance_id', 'MetagameEventEvent');
        }

        // No check needed since ZoneUtils will validate it
        this.zone = ZoneUtils.parse(EventId.eventIdToZoneId(eventId));
    }
}
