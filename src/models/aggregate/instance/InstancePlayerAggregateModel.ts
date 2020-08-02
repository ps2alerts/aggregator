import {Document, Schema} from 'mongoose';
import PS2AlertsInstanceInterface from '../../../interfaces/PS2AlertsInstanceInterface';

export interface InstancePlayerAggregateSchemaInterface extends Document {
    instance: PS2AlertsInstanceInterface['instanceId'];
    player: string; // Subject to change to a PlayerInterface
    kills: number;
    deaths: number;
    teamKills: number;
    suicides: number;
    headshots: number;
}

export const instancePlayerAggregateSchema: Schema = new Schema({
    instance: {
        type: String,
        required: true,
    },
    player: {
        type: String,
        required: true,
    },
    kills: {
        type: Number,
        required: true,
        default: 0,
    },
    deaths: {
        type: Number,
        required: true,
        default: 0,
    },
    teamKills: {
        type: Number,
        required: true,
        default: 0,
    },
    suicides: {
        type: Number,
        required: true,
        default: 0,
    },
    headshots: {
        type: Number,
        required: true,
        default: 0,
    },
}).index(
    {instance: 1, player: 1},
    {unique: true},
);
