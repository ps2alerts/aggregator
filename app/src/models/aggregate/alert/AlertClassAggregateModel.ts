import {Document, Schema} from 'mongoose';
import {AlertSchemaInterface} from '../../AlertModel';
import {Loadout, loadoutArray} from '../../../constants/loadout';

export interface AlertClassAggregateSchemaInterface extends Document {
    class: Loadout; // Subject to change to a PlayerInterface
    alert: AlertSchemaInterface['alertId'];
    kills: number;
    deaths: number;
    teamKills: number;
    suicides: number;
    headshots: number;
}

export const alertClassAggregateSchema: Schema = new Schema({
    class: {
        type: Number,
        enum: loadoutArray,
        required: true,
    },
    alert: {
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
    {class: 1, alert: 1},
    {unique: true},
);
