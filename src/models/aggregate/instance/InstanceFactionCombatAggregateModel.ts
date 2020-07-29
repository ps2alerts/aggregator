import {Document, Schema} from 'mongoose';
import {InstanceSchemaInterface} from '../../InstanceModel';

export interface InstanceFactionCombatAggregateSchemaInterface extends Document {
    instance: InstanceSchemaInterface['instanceId'];
    vs: InstanceFactionCombatAggregateSubSchemaInterface;
    nc: InstanceFactionCombatAggregateSubSchemaInterface;
    tr: InstanceFactionCombatAggregateSubSchemaInterface;
    nso: InstanceFactionCombatAggregateSubSchemaInterface;
    totals: InstanceFactionCombatAggregateSubSchemaInterface;
}

export interface InstanceFactionCombatAggregateSubSchemaInterface extends Document {
    kills: number;
    deaths: number;
    teamKills: number;
    suicides: number;
    headshots: number;
}

export const instanceFactionCombatAggregateSubSchema: Schema = new Schema({
    kills: {
        type: Number,
        required: true,
    },
    deaths: {
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
});

export const instanceFactionCombatAggregateSchema: Schema = new Schema({
    instance: {
        type: String,
        required: true,
        unique: true,
    },
    vs: {
        type: instanceFactionCombatAggregateSubSchema,
        default: {},
        required: true,
    },
    nc: {
        type: instanceFactionCombatAggregateSubSchema,
        default: {},
        required: true,
    },
    tr: {
        type: instanceFactionCombatAggregateSubSchema,
        default: {},
        required: true,
    },
    nso: {
        type: instanceFactionCombatAggregateSubSchema,
        default: {},
        required: true,
    },
    totals: {
        type: instanceFactionCombatAggregateSubSchema,
        default: {},
        required: true,
    },
});
