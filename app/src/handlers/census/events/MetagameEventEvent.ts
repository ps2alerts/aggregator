import { injectable } from 'inversify';
import { GenericEvent } from '../../../types/censusEventTypes';
import {MetagameEvent} from "ps2census/dist/client/utils/PS2Events";
import IllegalArgumentException from "../../../exceptions/IllegalArgumentException";
import EventId from "../../../utils/eventId";

export enum MetagameEventState {
    Started,
    Ended
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
    public readonly zoneId: number;

    public constructor(
        event: GenericEvent
    ) {
        const mge = event as MetagameEvent;
        this.worldId = MetagameEventEvent.parseArgumentAsNumber(mge.world_id);
        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException("IllegalArgument: world_id")
        }
        if (mge.metagame_event_state_name === null || mge.metagame_event_state_name === undefined) {
            throw new IllegalArgumentException("IllegalArgument: metagame_event_state_name")
        }
        const eventStateName = mge.metagame_event_state_name;
        if (eventStateName !== "started" && eventStateName !== "ended") {
            throw new IllegalArgumentException("IllegalArgument: metagame_event_state_name")
        }
        this.eventState = eventStateName === "started"? MetagameEventState.Started: MetagameEventState.Ended;
        this.factionNc = MetagameEventEvent.parseArgumentAsNumber(mge.faction_nc, true);
        if (isNaN(this.factionNc)) {
            throw new IllegalArgumentException("IllegalArgument: faction_nc")
        }
        this.factionTr = MetagameEventEvent.parseArgumentAsNumber(mge.faction_tr, true);
        if (isNaN(this.factionTr)) {
            throw new IllegalArgumentException("IllegalArgument: faction_tr")
        }
        this.factionVs = MetagameEventEvent.parseArgumentAsNumber(mge.faction_vs, true);
        if (isNaN(this.factionVs)) {
            throw new IllegalArgumentException("IllegalArgument: faction_vs")
        }
        this.timestamp = MetagameEventEvent.parseArgumentAsNumber(mge.timestamp);
        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException("IllegalArgument: timestamp")
        }
        const eventId = MetagameEventEvent.parseArgumentAsNumber(mge.metagame_event_id);
        if (isNaN(eventId)) {
            throw new IllegalArgumentException("IllegalArgument: metagame_event_id")
        }
        // TODO InstanceID are missing in the declaration
        // @ts-ignore
        this.instanceId = MetagameEventEvent.parseArgumentAsNumber(mge.instance_id);
        if (isNaN(this.instanceId)) {
            throw new IllegalArgumentException("IllegalArgument: instance_id")
        }
        this.zoneId = EventId.eventIdToZoneId(eventId);
        if (this.zoneId === -1) {
            throw new IllegalArgumentException("IllegalArgument: Could not determine ZoneId - Unsupported alert type?")
        }
    }
    private static parseArgumentAsNumber(argument: string, float = false): number {
        if (argument === null || argument === undefined) {
            return NaN;
        }
        return float? parseFloat(argument):parseInt(argument);
    }
}
