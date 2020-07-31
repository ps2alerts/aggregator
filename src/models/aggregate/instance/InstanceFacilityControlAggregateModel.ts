import {Document, Schema} from 'mongoose';
import PS2AlertsInstanceInterface from '../../../interfaces/PS2AlertsInstanceInterface';

export interface InstanceFacilityControlAggregateInterface extends Document {
    instance: PS2AlertsInstanceInterface['instanceId'];
    facility: number;
    vs: InstanceFacilityControlFactionAggregateInterface;
    nc: InstanceFacilityControlFactionAggregateInterface;
    tr: InstanceFacilityControlFactionAggregateInterface;
    totals: InstanceFacilityControlFactionAggregateInterface;
}

export interface InstanceFacilityControlFactionAggregateInterface extends Document {
    captures: number;
    defences: number;
}

export const instanceFactionFacilityControlAggregateSchema: Schema = new Schema({
    captures: {
        type: Number,
        default: 0,
    },
    defences: {
        type: Number,
        default: 0,
    },
});

export const instanceFacilityControlAggregateSchema: Schema = new Schema({
    instance: {
        type: String,
        required: true,
    },
    facility: {
        type: Number,
        required: true,
    },
    vs: {
        type: instanceFactionFacilityControlAggregateSchema,
        required: true,
    },
    nc: {
        type: instanceFactionFacilityControlAggregateSchema,
        required: true,
    },
    tr: {
        type: instanceFactionFacilityControlAggregateSchema,
        required: true,
    },
    // No NSO, they cannot capture bases on behalf of their faction. Their outfits can though strangely!
    totals: {
        type: instanceFactionFacilityControlAggregateSchema,
        required: true,
    },
}).index(
    {instance: 1, facility: 1},
    {unique: true},
);
