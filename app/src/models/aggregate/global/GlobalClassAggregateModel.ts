import {Document, Schema} from 'mongoose';
import {Loadout, loadoutArray} from '../../../constants/loadout';
import {World, worldArray} from '../../../constants/world';

export interface GlobalClassAggregateSchemaInterface extends Document {
    class: Loadout; // Subject to change to a PlayerInterface
    world: World;
    kills: number;
    deaths: number;
    teamKills: number;
    suicides: number;
    headshots: number;
}

export const globalClassAggregateSchema: Schema = new Schema({
    class: {
        type: Number,
        enum: loadoutArray,
        required: true,
    },
    world: {
        type: Number,
        enum: worldArray,
        required: true,
    },
    kills: {
        type: Number,
        required: true,
        default: 0,
    },
    deaths: {
        type: Number,
        required: true,
        default: 0,
    },
    teamKills: {
        type: Number,
        required: true,
        default: 0,
    },
    suicides: {
        type: Number,
        required: true,
        default: 0,
    },
    headshots: {
        type: Number,
        required: true,
        default: 0,
    },
}).index(
    {class: 1, world: 1},
    {unique: true},
);
