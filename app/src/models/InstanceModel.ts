import {Document, Schema} from 'mongoose';
import {MetagameEventState} from '../constants/metagameEventState';
import {World} from '../constants/world';
import {Zone} from '../constants/zone';

export interface InstanceSchemaInterface extends Document {
    instanceId: string;
    world: World;
    zone: Zone;
    state: MetagameEventState;
    timeStarted: Date;
    timeEnded: Date;
}

export const instanceSchema: Schema = new Schema({
    censusInstanceId: {
        type: String,
        required: true,
    },
    world: {
        type: Number,
        required: true,
    },
    zone: {
        type: Number,
        required: true,
    },
    state: {
        type: Number,
        required: true,
    },
    timeStarted: {
        type: Date,
        required: true,
    },
    timeEnded: {
        type: Date,
    },
}).index(
    {censusInstanceId: 1, world: 1, zone: 1},
    {unique: true},
);
