import {Document, Schema} from 'mongoose';
import {World} from '../constants/world';
import {Zone} from '../constants/zone';
import {InstanceSchemaInterface} from './InstanceModel';

export interface ActiveInstanceSchemaInterface extends Document {
    instanceId: InstanceSchemaInterface['instanceId'];
    censusInstanceId: number;
    world: World;
    zone: Zone;
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
    world: {
        type: Number,
        required: true,
    },
    zone: {
        type: Number,
        required: true,
    },
}).index(
    {instanceId: 1, world: 1, zone: 1},
    {unique: true},
);
