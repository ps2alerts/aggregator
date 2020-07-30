import {Document, Schema} from 'mongoose';
import {World, worldArray} from '../../../constants/world';

export interface GlobalFacilityControlAggregateSchemaInterface extends Document {
    facility: number;
    world: World;
    vs: GlobalFacilityControlFactionAggregateInterface;
    nc: GlobalFacilityControlFactionAggregateInterface;
    tr: GlobalFacilityControlFactionAggregateInterface;
    totals: GlobalFacilityControlFactionAggregateInterface;
}

export interface GlobalFacilityControlFactionAggregateInterface extends Document {
    captures: number;
    defences: number;
}

export const globalFacilityControlFactionAggregateSchema: Schema = new Schema({
    captures: {
        type: Number,
        default: 0,
    },
    defences: {
        type: Number,
        default: 0,
    },
});

export const globalFacilityControlAggregateSchema: Schema = new Schema({
    facility: {
        type: Number,
        required: true,
    },
    world: {
        type: Number,
        enum: worldArray,
    },
    vs: {
        type: globalFacilityControlFactionAggregateSchema,
        required: true,
    },
    nc: {
        type: globalFacilityControlFactionAggregateSchema,
        required: true,
    },
    tr: {
        type: globalFacilityControlFactionAggregateSchema,
        required: true,
    },
    // No NSO, they cannot capture bases on behalf of their faction. Their outfits can though strangely!
    totals: {
        type: globalFacilityControlFactionAggregateSchema,
        required: true,
    },
}).index(
    {facility: 1, world: 1},
    {unique: true},
);
