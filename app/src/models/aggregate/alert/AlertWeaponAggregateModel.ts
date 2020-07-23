import {Document, Schema} from 'mongoose';
import {AlertSchemaInterface} from '../../AlertModel';

export interface AlertWeaponAggregateSchemaInterface extends Document {
    alert: AlertSchemaInterface['alertId'];
    weapon: number;
    kills: number;
    teamKills: number;
    suicides: number;
    headshots: number;
}

export const alertWeaponAggregateSchema: Schema = new Schema({
    alert: {
        type: String,
        required: true,
    },
    weapon: {
        type: Number,
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
}).index({alert: 1, weapon: 1});
