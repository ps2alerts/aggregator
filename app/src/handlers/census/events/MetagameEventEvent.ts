import { injectable } from 'inversify';
import { GenericEvent } from '../../../types/censusEventTypes';
import {MetagameEvent} from 'ps2census/dist/client/utils/PS2Events';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import EventId from '../../../utils/eventId';
import Parser from '../../../utils/parser';
import {Zone} from '../../../constants/zone';
import ZoneUtils from '../../../utils/ZoneUtils';

export enum MetagameEventState {
    started,
    ended
}

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

    public constructor(
        event: GenericEvent
    ) {
        const mge = event as MetagameEvent;
        this.worldId = Parser.parseArgumentAsNumber(mge.world_id);
        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('IllegalArgument: world_id');
        }
        if (mge.metagame_event_state_name === null || undefined === mge.metagame_event_state_name) {
            throw new IllegalArgumentException('IllegalArgument: metagame_event_state_name');
        }
        const eventStateName = mge.metagame_event_state_name;
        if (eventStateName !== 'started' && eventStateName !== 'ended') {
            throw new IllegalArgumentException('IllegalArgument: metagame_event_state_name');
        }
        this.eventState = eventStateName === 'started'? MetagameEventState.started: MetagameEventState.ended;
        this.factionNc = Parser.parseArgumentAsNumber(mge.faction_nc, true);
        if (isNaN(this.factionNc)) {
            throw new IllegalArgumentException('IllegalArgument: faction_nc');
        }
        this.factionTr = Parser.parseArgumentAsNumber(mge.faction_tr, true);
        if (isNaN(this.factionTr)) {
            throw new IllegalArgumentException('IllegalArgument: faction_tr');
        }
        this.factionVs = Parser.parseArgumentAsNumber(mge.faction_vs, true);
        if (isNaN(this.factionVs)) {
            throw new IllegalArgumentException('IllegalArgument: faction_vs');
        }
        this.timestamp = Parser.parseArgumentAsNumber(mge.timestamp);
        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('IllegalArgument: timestamp');
        }
        const eventId = Parser.parseArgumentAsNumber(mge.metagame_event_id);
        if (isNaN(eventId)) {
            throw new IllegalArgumentException('IllegalArgument: metagame_event_id');
        }
        // TODO InstanceID are missing in the declaration
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.instanceId = Parser.parseArgumentAsNumber(mge.instance_id);
        if (isNaN(this.instanceId)) {
            throw new IllegalArgumentException('IllegalArgument: instance_id');
        }
        // No check needed since ZoneUtils will validate it
        this.zone = ZoneUtils.parse(EventId.eventIdToZoneId(eventId));
    }
}
