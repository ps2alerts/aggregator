import {Document, Schema} from 'mongoose';
import PS2AlertsInstanceInterface from '../../../interfaces/PS2AlertsInstanceInterface';

export interface InstancePopulationAggregateSchemaInterface extends Document {
    instance: PS2AlertsInstanceInterface['instanceId'];
    timestamp: Date;
    vs: number;
    nc: number;
    tr: number;
    nso: number;
    total: number;
}

export const instancePopulationAggregateSchema: Schema = new Schema({
    instance: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        required: true,
    },
    vs: {
        type: Number,
        required: true,
        default: 0,
    },
    nc: {
        type: Number,
        required: true,
        default: 0,
    },
    tr: {
        type: Number,
        required: true,
        default: 0,
    },
    nso: {
        type: Number,
        required: true,
        default: 0,
    },
    total: {
        type: Number,
        required: true,
        default: 0,
    },
}).index(
    {instance: 1, timestamp: 1},
    {unique: true},
);
