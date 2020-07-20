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
import {MetagameEvent, PS2Event} from 'ps2census';
import {MetagameEventState} from '../../../constants/metagameEventState';

@injectable()
export default class MetagameEventEvent {
    public readonly worldId: number;

    public readonly eventState: MetagameEventState;

    public readonly factionNc: number;

    public readonly factionTr: number;

    public readonly factionVs: number;

    public readonly timestamp: number;

    public readonly instanceId: number;

    public readonly zone: Zone;

    constructor(
        event: PS2Event,
    ) {
        if (!(event instanceof MetagameEvent)) {
            throw new IllegalArgumentException('event', 'MetagameEventEvent');
        }

        this.worldId = Parser.parseArgumentAsNumber(event.world_id);

        if (isNaN(this.worldId)) {
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
        this.factionNc = Parser.parseArgumentAsNumber(event.faction_nc, true);

        if (isNaN(this.factionNc)) {
            throw new IllegalArgumentException('faction_nc', 'MetagameEventEvent');
        }

        this.factionTr = Parser.parseArgumentAsNumber(event.faction_tr, true);

        if (isNaN(this.factionTr)) {
            throw new IllegalArgumentException('faction_tr', 'MetagameEventEvent');
        }

        this.factionVs = Parser.parseArgumentAsNumber(event.faction_vs, true);

        if (isNaN(this.factionVs)) {
            throw new IllegalArgumentException('faction_vs', 'MetagameEventEvent');
        }

        this.timestamp = Parser.parseArgumentAsNumber(event.timestamp);

        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp', 'MetagameEventEvent');
        }

        const eventId = Parser.parseArgumentAsNumber(event.metagame_event_id);

        if (isNaN(eventId)) {
            throw new IllegalArgumentException('metagame_event_id', 'MetagameEventEvent');
        }

        // TODO InstanceID are missing in the declaration
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.instanceId = Parser.parseArgumentAsNumber(event.instance_id);

        if (isNaN(this.instanceId)) {
            throw new IllegalArgumentException('instance_id', 'MetagameEventEvent');
        }

        // No check needed since ZoneUtils will validate it
        this.zone = ZoneUtils.parse(EventId.eventIdToZoneId(eventId));
    }
}
