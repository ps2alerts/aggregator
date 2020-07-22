import {Document, Schema} from 'mongoose';
import {AlertSchemaInterface} from '../AlertModel';

export interface AlertFactionCombatAggregateSchemaInterface extends Document {
    alertId: AlertSchemaInterface['alertId'];
    vs: AggregateFactionSchemaInterface;
    nc: AggregateFactionSchemaInterface;
    tr: AggregateFactionSchemaInterface;
    nso: AggregateFactionSchemaInterface;
    totals: AggregateFactionSchemaInterface;
}

export interface AggregateFactionSchemaInterface extends Document {
    kills: number;
    deaths: number;
    teamKills: number;
    suicides: number;
    headshots: number;
}

export const aggregateFactionSchema: Schema = new Schema({
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
    alertId: {
        type: String,
        required: true,
        unique: true,
    },
    vs: {
        type: aggregateFactionSchema,
        default: {},
    },
    nc: {
        type: aggregateFactionSchema,
        default: {},
    },
    tr: {
        type: aggregateFactionSchema,
        default: {},
    },
    nso: {
        type: aggregateFactionSchema,
        default: {},
    },
    totals: {
        type: aggregateFactionSchema,
        default: {},
    },
});
