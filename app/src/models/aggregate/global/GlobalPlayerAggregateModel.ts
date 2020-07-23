import {Document, Schema} from 'mongoose';
import {World, worldArray} from '../../../constants/world';

export interface GlobalPlayerAggregateSchemaInterface extends Document {
    player: string; // Subject to change to a PlayerInterface
    world: World;
    kills: number;
    deaths: number;
    teamKills: number;
    suicides: number;
    headshots: number;
}

export const globalPlayerAggregateSchema: Schema = new Schema({
    player: {
        type: String,
        required: true,
        unique: true,
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
});
