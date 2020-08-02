import {Document, Schema} from 'mongoose';
import {World, worldArray} from '../../constants/world';
import {Zone, zoneArray} from '../../constants/zone';
import {Ps2alertsEventType, ps2alertsEventTypeArray} from '../../constants/ps2alertsEventType';
import {Ps2alertsEventState, ps2alertsEventStateArray} from '../../constants/ps2alertsEventState';
import PS2AlertsInstanceInterface from '../../interfaces/PS2AlertsInstanceInterface';

export interface InstanceCustomWorldZoneSchemaInterface extends Document {
    instanceId: PS2AlertsInstanceInterface['instanceId'];
    world: World;
    timeStarted: Date;
    timeEnded: Date | null;
    zone: Zone;
    eventId: number;
    eventType: Ps2alertsEventType;
    state: Ps2alertsEventState;
    duration: number;
    description: string;
}

export const instanceCustomWorldZoneSchema: Schema = new Schema({
    instanceId: {
        type: String,
        required: true,
    },
    world: {
        type: Number,
        enum: worldArray,
        required: true,
    },
    timeStarted: {
        type: Date,
        required: true,
    },
    timeEnded: {
        type: Date,
    },
    zone: {
        type: Number,
        enum: zoneArray,
        required: true,
    },
    eventId: {
        type: Number,
        required: true,
    },
    eventType: {
        type: Number,
        enum: ps2alertsEventTypeArray,
        required: true,
    },
    state: {
        type: Number,
        enum: ps2alertsEventStateArray,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
}).index(
    {world: 1, zone: 1, eventId: 1},
    {unique: true},
);
