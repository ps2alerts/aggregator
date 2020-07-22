import {Document, Schema} from 'mongoose';
import {AlertSchemaInterface} from '../AlertModel';

export interface AlertFacilityControlAggregateInterface extends Document {
    alert: AlertSchemaInterface['alertId'];
    facility: number;
    vs: AlertFacilityControlFactionAggregateInterface;
    nc: AlertFacilityControlFactionAggregateInterface;
    tr: AlertFacilityControlFactionAggregateInterface;
    totals: AlertFacilityControlFactionAggregateInterface;
}

export interface AlertFacilityControlFactionAggregateInterface extends Document {
    captures: number;
    defences: number;
}

export const aggregateFactionFacilityControlSchema: Schema = new Schema({
    captures: {
        type: Number,
        default: 0,
    },
    defences: {
        type: Number,
        default: 0,
    },
});

export const aggregateAlertFacilityControlSchema: Schema = new Schema({
    alert: {
        type: String,
        required: true,
    },
    facility: {
        type: Number,
        required: true,
    },
    vs: {
        type: aggregateFactionFacilityControlSchema,
        required: true,
    },
    nc: {
        type: aggregateFactionFacilityControlSchema,
        required: true,
    },
    tr: {
        type: aggregateFactionFacilityControlSchema,
        required: true,
    },
    // No NSO, they cannot capture bases on behalf of their faction. Their outfits can though strangely!
    totals: {
        type: aggregateFactionFacilityControlSchema,
        required: true,
    },
});
