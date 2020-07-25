import {Document, Schema} from 'mongoose';
import {AlertSchemaInterface} from '../../AlertModel';

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

export const alertFactionFacilityControlAggregateSchema: Schema = new Schema({
    captures: {
        type: Number,
        default: 0,
    },
    defences: {
        type: Number,
        default: 0,
    },
});

export const alertFacilityControlAggregateSchema: Schema = new Schema({
    alert: {
        type: String,
        required: true,
    },
    facility: {
        type: Number,
        required: true,
    },
    vs: {
        type: alertFactionFacilityControlAggregateSchema,
        required: true,
    },
    nc: {
        type: alertFactionFacilityControlAggregateSchema,
        required: true,
    },
    tr: {
        type: alertFactionFacilityControlAggregateSchema,
        required: true,
    },
    // No NSO, they cannot capture bases on behalf of their faction. Their outfits can though strangely!
    totals: {
        type: alertFactionFacilityControlAggregateSchema,
        required: true,
    },
}).index(
    {alert: 1, facility: 1},
    {unique: true},
);
