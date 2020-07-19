import mongoose, {Document, Schema} from 'mongoose';
import {AlertState} from '../constants/alertState';
import {World} from '../constants/world';
import {Zone} from '../constants/zone';

export interface AlertInterface extends Document {
    world: World;
    zone: Zone;
    state: AlertState;
    timeStarted: number;
    timeEnded: number;
}

const alertModel: Schema = new Schema({
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

export default mongoose.model<AlertInterface>('Alert', alertModel);
