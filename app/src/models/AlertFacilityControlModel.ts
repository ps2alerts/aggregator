import {Document, Schema} from 'mongoose';
import {AlertSchemaInterface} from './AlertModel';
import {Faction, factionArray} from '../constants/faction';

export interface AlertFacilityControlInterface extends Document {
    alertId: AlertSchemaInterface['alertId'];
    facility: number;
    timestamp: number;
    oldFaction: Faction;
    newFaction: Faction;
    durationHeld: number;
    isDefence: boolean;
    outfitCaptured: string|null;
}

export const alertFacilityControlSchema: Schema = new Schema({
    alert: {
        type: String,
        required: true,
    },
    facility: {
        type: Number,
        required: true,
    },
    timestamp: {
        type: Number,
        required: true,
    },
    oldFaction: {
        type: Number,
        enum: factionArray,
        required: true,
    },
    newFaction: {
        type: Number,
        enum: factionArray,
        required: true,
    },
    durationHeld: {
        type: Number,
        default: 0,
    },
    isDefence: {
        type: Boolean,
        required: true,
    },
    outfitCaptured: {
        type: String,
        default: null,
    },
}).index(
    {alertId: 1, facility: 1, timestamp: 1},
    {unique: true},
);
