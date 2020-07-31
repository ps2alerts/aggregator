import {Document, Schema} from 'mongoose';
import {World, worldArray} from '../../constants/world';
import {Zone, zoneArray} from '../../constants/zone';
import {MetagameEventType, metagameEventTypeArray} from '../../constants/metagameEventType';
import PS2AlertsInstanceInterface from '../../interfaces/PS2AlertsInstanceInterface';
import {Ps2alertsEventState, ps2alertsEventStateArray} from '../../constants/ps2alertsEventState';

export interface InstanceMetagameSchemaInterface extends Document {
    instanceId: PS2AlertsInstanceInterface['instanceId'];
    world: World;
    timeStarted: Date;
    timeEnded: Date | null;
    zone: Zone;
    censusInstanceId: number;
    censusMetagameEventType: MetagameEventType;
    state: Ps2alertsEventState;
}

export const instanceMetagameSchema: Schema = new Schema({
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
    censusInstanceId: {
        type: Number,
        required: true,
    },
    censusMetagameEventType: {
        type: Number,
        enum: metagameEventTypeArray,
        required: true,
    },
    state: {
        type: Number,
        enum: ps2alertsEventStateArray,
        required: true,
    },
}).index(
    {world: 1, censusInstanceId: 1},
    {unique: true},
);
