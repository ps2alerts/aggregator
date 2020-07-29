import {Document, Schema} from 'mongoose';
import {World, worldArray} from '../../../constants/world';

export interface WorldFacilityControlAggregateInterface extends Document {
    facility: number;
    world: World;
    vs: WorldFacilityControlFactionAggregateInterface;
    nc: WorldFacilityControlFactionAggregateInterface;
    tr: WorldFacilityControlFactionAggregateInterface;
    totals: WorldFacilityControlFactionAggregateInterface;
}

export interface WorldFacilityControlFactionAggregateInterface extends Document {
    captures: number;
    defences: number;
}

export const worldFacilityControlFactionAggregateSchema: Schema = new Schema({
    captures: {
        type: Number,
        default: 0,
    },
    defences: {
        type: Number,
        default: 0,
    },
});

export const worldFacilityControlAggregateSchema: Schema = new Schema({
    facility: {
        type: Number,
        required: true,
    },
    world: {
        type: Number,
        enum: worldArray,
    },
    vs: {
        type: worldFacilityControlFactionAggregateSchema,
        required: true,
    },
    nc: {
        type: worldFacilityControlFactionAggregateSchema,
        required: true,
    },
    tr: {
        type: worldFacilityControlFactionAggregateSchema,
        required: true,
    },
    // No NSO, they cannot capture bases on behalf of their faction. Their outfits can though strangely!
    totals: {
        type: worldFacilityControlFactionAggregateSchema,
        required: true,
    },
}).index(
    {facility: 1, world: 1},
    {unique: true},
);
