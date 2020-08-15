import {Document, Schema} from 'mongoose';
import PS2AlertsInstanceInterface from '../../../interfaces/PS2AlertsInstanceInterface';
import {OutfitInterface} from '../../../interfaces/OutfitInterface';

export interface InstanceOutfitAggregateSchemaInterface extends Document {
    instance: PS2AlertsInstanceInterface['instanceId'];
    outfit: OutfitInterface['id'];
    kills: number;
    deaths: number;
    teamKills: number;
    suicides: number;
    headshots: number;
}

export const instanceOutfitAggregateSchema: Schema = new Schema({
    instance: {
        type: String,
        required: true,
    },
    outfit: {
        type: String,
        required: true,
    },
    kills: {
        type: Number,
        required: true,
    },
    deaths: {
        type: Number,
        required: true,
    },
    teamKills: {
        type: Number,
        required: true,
    },
    suicides: {
        type: Number,
        required: true,
    },
    headshots: {
        type: Number,
        required: true,
    },
}).index(
    {instance: 1, outfit: 1},
    {unique: true},
);
