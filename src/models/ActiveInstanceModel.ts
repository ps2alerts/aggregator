import {Document, Schema} from 'mongoose';
import {World} from '../constants/world';
import {Zone} from '../constants/zone';
import {InstanceSchemaInterface} from './InstanceModel';
import {MetagameEventIds, metagameEventIdsArray} from '../constants/metagameEventIds';

export interface ActiveInstanceSchemaInterface extends Document {
    instanceId: InstanceSchemaInterface['instanceId'];
    censusInstanceId: number;
    metagameEventType: MetagameEventIds;
    world: World;
    zone: Zone;
    timeStarted: Date;
}

export const activeInstanceSchema: Schema = new Schema({
    instanceId: {
        type: String,
        required: true,
    },
    censusInstanceId: {
        type: Number,
        required: true,
    },
    metagameEventType: {
        type: Number,
        enum: metagameEventIdsArray,
    },
    world: {
        type: Number,
        required: true,
    },
    zone: {
        type: Number,
        required: true,
    },
    timeStarted: {
        type: Date,
        required: true,
    },
}).index(
    {instanceId: 1, world: 1, zone: 1},
    {unique: true},
);
