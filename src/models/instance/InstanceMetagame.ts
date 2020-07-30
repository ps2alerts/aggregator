import {Document, Schema} from 'mongoose';
import {World, worldArray} from '../../constants/world';
import {Zone, zoneArray} from '../../constants/zone';
import {MetagameEventType, metagameEventTypeArray} from '../../constants/metagameEventType';
import {MetagameEventState, metagameEventStateArray} from '../../constants/metagameEventState';

export interface InstanceMetagameSchemaInterface extends Document {
    instanceId: string;
    world: World;
    timeStarted: Date;
    timeEnded: Date | null;
    zone: Zone;
    censusInstanceId: number;
    censusMetagameEventType: MetagameEventType;
    state: MetagameEventState;
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
        enum: metagameEventStateArray,
        required: true,
    },
}).index(
    {world: 1, censusInstanceId: 1},
    {unique: true},
);
