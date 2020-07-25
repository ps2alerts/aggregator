import {Document, Schema} from 'mongoose';
import {InstanceSchemaInterface} from '../../InstanceModel';

export interface InstanceWeaponAggregateSchemaInterface extends Document {
    instance: InstanceSchemaInterface['instanceId'];
    weapon: number;
    kills: number;
    teamKills: number;
    suicides: number;
    headshots: number;
}

export const instanceWeaponAggregateSchema: Schema = new Schema({
    instance: {
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
}).index(
    {instance: 1, weapon: 1},
    {unique: true},
);
