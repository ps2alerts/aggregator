import {Document, Schema} from 'mongoose';
import {MetagameEventState} from '../constants/metagameEventState';
import {World} from '../constants/world';
import {Zone} from '../constants/zone';

export interface AlertSchemaInterface extends Document {
    alertId: string;
    world: World;
    zone: Zone;
    state: MetagameEventState;
    timeStarted: number;
    timeEnded: number;
}

export const alertSchema: Schema = new Schema({
    alertId: {
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
    {alertId: 1, world: 1, zone: 1},
    {unique: true},
);
