import {Document, Schema} from 'mongoose';
import {AlertState} from '../constants/alertState';
import {World} from '../constants/world';
import {Zone} from '../constants/zone';

export interface AlertInterface extends Document {
    alertId: string;
    world: World;
    zone: Zone;
    state: AlertState;
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
        type: Number,
        required: true,
    },
    timeEnded: {
        type: Number,
    },
});
