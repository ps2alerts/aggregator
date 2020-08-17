import {Document, Schema} from 'mongoose';
import {World, worldArray} from '../../../constants/world';
import {OutfitInterface} from '../../../interfaces/OutfitInterface';

export interface GlobalOutfitAggregateSchemaInterface extends Document {
    outfit: OutfitInterface['id'];
    world: World;
    kills: number;
    deaths: number;
    teamKills: number;
    suicides: number;
    headshots: number;
}

export const globalOutfitAggregateSchema: Schema = new Schema({
    outfit: {
        type: String,
        required: true,
    },
    world: {
        type: Number,
        enum: worldArray,
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
    {outfit: 1, world: 1},
    {unique: true},
);
