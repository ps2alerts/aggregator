import {Document, Schema} from 'mongoose';
import PS2AlertsInstanceInterface from '../../../interfaces/PS2AlertsInstanceInterface';

export interface InstancePopulationAggregateSchemaInterface extends Document {
    instance: PS2AlertsInstanceInterface['instanceId'];
    timestamp: Date;
    vsPop: number;
    ncPop: number;
    trPop: number;
    nsoPop: number;
    totalPop: number;
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
    vsPop: {
        type: Number,
        required: true,
        default: 0,
    },
    ncPop: {
        type: Number,
        required: true,
        default: 0,
    },
    trPop: {
        type: Number,
        required: true,
        default: 0,
    },
    nsoPop: {
        type: Number,
        required: true,
        default: 0,
    },
    totalPop: {
        type: Number,
        required: true,
        default: 0,
    },
}).index(
    {instance: 1, timestamp: 1},
    {unique: true},
);
