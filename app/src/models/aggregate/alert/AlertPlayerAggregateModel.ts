import {Document, Schema} from 'mongoose';
import {AlertSchemaInterface} from '../../AlertModel';

export interface AlertPlayerAggregateSchemaInterface extends Document {
    alert: AlertSchemaInterface['alertId'];
    player: string; // Subject to change to a PlayerInterface
    kills: number;
    deaths: number;
    teamKills: number;
    suicides: number;
    headshots: number;
}

export const alertPlayerAggregateSchema: Schema = new Schema({
    alert: {
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
    {alert: 1, player: 1},
    {unique: true},
);
