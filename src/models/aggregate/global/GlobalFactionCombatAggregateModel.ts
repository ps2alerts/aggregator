import {Document, Schema} from 'mongoose';
import {World, worldArray} from '../../../constants/world';

export interface GlobalFactionCombatAggregateSchemaInterface extends Document {
    world: World;
    vs: GlobalFactionCombatAggregateSchemaInterface;
    nc: GlobalFactionCombatAggregateSchemaInterface;
    tr: GlobalFactionCombatAggregateSchemaInterface;
    nso: GlobalFactionCombatAggregateSchemaInterface;
    totals: GlobalFactionCombatAggregateSchemaInterface;
}

export interface GlobalFactionCombatAggregateSchemaInterface extends Document {
    kills: number;
    deaths: number;
    teamKills: number;
    suicides: number;
    headshots: number;
}

export const globalFactionCombatAggregateSubSchema: Schema = new Schema({
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

export const globalFactionCombatAggregateSchema: Schema = new Schema({
    world: {
        type: Number,
        enum: worldArray,
        required: true,
        unique: true,
    },
    vs: {
        type: globalFactionCombatAggregateSubSchema,
        default: {},
        required: true,
    },
    nc: {
        type: globalFactionCombatAggregateSubSchema,
        default: {},
        required: true,
    },
    tr: {
        type: globalFactionCombatAggregateSubSchema,
        default: {},
        required: true,
    },
    nso: {
        type: globalFactionCombatAggregateSubSchema,
        default: {},
        required: true,
    },
    totals: {
        type: globalFactionCombatAggregateSubSchema,
        default: {},
        required: true,
    },
});
