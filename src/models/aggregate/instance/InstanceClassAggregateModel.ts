import {Document, Schema} from 'mongoose';
import {Loadout, loadoutArray} from '../../../constants/loadout';
import PS2AlertsInstanceInterface from '../../../interfaces/PS2AlertsInstanceInterface';

export interface InstanceClassAggregateSchemaInterface extends Document {
    instance: PS2AlertsInstanceInterface['instanceId'];
    class: Loadout; // Subject to change to a PlayerInterface
    kills: number;
    deaths: number;
    teamKills: number;
    suicides: number;
    headshots: number;
}

export const instanceClassAggregateSchema: Schema = new Schema({
    instance: {
        type: String,
        required: true,
    },
    class: {
        type: Number,
        enum: loadoutArray,
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
    {instance: 1, class: 1},
    {unique: true},
);
