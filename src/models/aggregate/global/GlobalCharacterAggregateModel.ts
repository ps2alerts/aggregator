import {Document, Schema} from 'mongoose';
import {World, worldArray} from '../../../constants/world';
import {CharacterInterface} from '../../../interfaces/CharacterInterface';

export interface GlobalCharacterAggregateSchemaInterface extends Document {
    character: CharacterInterface['id'];
    world: World;
    kills: number;
    deaths: number;
    teamKills: number;
    suicides: number;
    headshots: number;
}

export const globalCharacterAggregateSchema: Schema = new Schema({
    character: {
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
    {character: 1, world: 1},
    {unique: true},
);
