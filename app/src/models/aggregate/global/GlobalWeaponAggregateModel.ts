import {Document, Schema} from 'mongoose';
import {World, worldArray} from '../../../constants/world';

export interface GlobalWeaponAggregateSchemaInterface extends Document {
    weapon: number;
    world: World;
    kills: number;
    teamKills: number;
    suicides: number;
    headshots: number;
}

export const globalWeaponAggregateSchema: Schema = new Schema({
    weapon: {
        type: Number,
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
}).index({weapon: 1, world: 1});
