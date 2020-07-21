import {Document, Schema} from 'mongoose';
import {World} from '../constants/world';
import {Zone} from '../constants/zone';
import {AlertSchemaInterface} from './AlertModel';

export interface ActiveAlertSchemaInterface extends Document {
    alertId: AlertSchemaInterface['alertId'];
    instanceId: number;
    world: World;
    zone: Zone;
}

export const activeAlertSchema: Schema = new Schema({
    alertId: {
        type: Schema.Types.String,
        required: true,
    },
    instanceId: {
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
