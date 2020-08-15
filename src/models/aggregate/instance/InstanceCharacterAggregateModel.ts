import {Document, Schema} from 'mongoose';
import PS2AlertsInstanceInterface from '../../../interfaces/PS2AlertsInstanceInterface';
import {CharacterInterface} from '../../../interfaces/CharacterInterface';

export interface InstanceCharacterAggregateSchemaInterface extends Document {
    instance: PS2AlertsInstanceInterface['instanceId'];
    character: CharacterInterface['id'];
    kills: number;
    deaths: number;
    teamKills: number;
    suicides: number;
    headshots: number;
}

export const instanceCharacterAggregateSchema: Schema = new Schema({
    instance: {
        type: String,
        required: true,
    },
    character: {
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
    {instance: 1, character: 1},
    {unique: true},
);
