import {Document, Schema} from 'mongoose';
import {AlertSchemaInterface} from '../../AlertModel';

export interface AlertFactionCombatAggregateSchemaInterface extends Document {
    alert: AlertSchemaInterface['alertId'];
    vs: AlertFactionCombatAggregateSubSchemaInterface;
    nc: AlertFactionCombatAggregateSubSchemaInterface;
    tr: AlertFactionCombatAggregateSubSchemaInterface;
    nso: AlertFactionCombatAggregateSubSchemaInterface;
    totals: AlertFactionCombatAggregateSubSchemaInterface;
}

export interface AlertFactionCombatAggregateSubSchemaInterface extends Document {
    kills: number;
    deaths: number;
    teamKills: number;
    suicides: number;
    headshots: number;
}

export const alertFactionCombatAggregateSubSchema: Schema = new Schema({
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

export const alertFactionCombatAggregateSchema: Schema = new Schema({
    alert: {
        type: String,
        required: true,
        unique: true,
    },
    vs: {
        type: alertFactionCombatAggregateSubSchema,
        default: {},
        required: true,
    },
    nc: {
        type: alertFactionCombatAggregateSubSchema,
        default: {},
        required: true,
    },
    tr: {
        type: alertFactionCombatAggregateSubSchema,
        default: {},
        required: true,
    },
    nso: {
        type: alertFactionCombatAggregateSubSchema,
        default: {},
        required: true,
    },
    totals: {
        type: alertFactionCombatAggregateSubSchema,
        default: {},
        required: true,
    },
});
