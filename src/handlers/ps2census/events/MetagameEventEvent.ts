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
import Parser from '../../../utils/parser';
import {Zone} from '../../../ps2alerts-constants/zone';
import {MetagameEvent} from 'ps2census';
import {MetagameEventState} from '../../../ps2alerts-constants/metagameEventState';
import {World} from '../../../ps2alerts-constants/world';
import {
    MetagameDetailsInterface,
    MetagameEventType,
    metagameEventTypeDetailsMap,
} from '../../../ps2alerts-constants/metagameEventType';
import ApplicationException from '../../../exceptions/ApplicationException';

@injectable()
export default class MetagameEventEvent {
    public readonly world: World;
    public readonly eventState: MetagameEventState;
    public readonly eventType: MetagameEventType;
    public readonly factionNc: number;
    public readonly factionTr: number;
    public readonly factionVs: number;
    public readonly timestamp: Date;
    public readonly instanceId: number;
    public readonly zone: Zone;
    public readonly details: MetagameDetailsInterface;

    constructor(event: MetagameEvent) {
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

        this.eventType = Parser.parseNumericalArgument(event.metagame_event_id, false);

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

        this.instanceId = Parser.parseNumericalArgument(event.instance_id);

        if (isNaN(this.instanceId)) {
            throw new IllegalArgumentException('instance_id', 'MetagameEventEvent');
        }

        const details = metagameEventTypeDetailsMap.get(this.eventType);

        if (!details) {
            throw new ApplicationException(`Unable to determine event details / zone for event type ${this.eventType}`);
        }

        this.details = details;

        this.zone = details.zone;
    }
}
