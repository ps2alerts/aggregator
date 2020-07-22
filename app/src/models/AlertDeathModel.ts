import {Document, Schema} from 'mongoose';
import {AlertSchemaInterface} from './AlertModel';
import {Loadout, loadoutArray} from '../constants/loadout';
import {factionArray} from '../constants/faction';

export interface AlertDeathSchemaInterface extends Document {
    alert: AlertSchemaInterface['alertId'];
    attacker: string;
    player: string;
    timestamp: number;
    attackerFiremode: number;
    attackerLoadout: number;
    weapon: number;
    playerLoadout: Loadout;
    isHeadshot: boolean;
    isSuicide: boolean;
    isTeamkill: boolean;
    vehicle: number;
}

export const alertDeathSchema: Schema = new Schema({
    alert: {
        type: String,
        required: true,
    },
    attacker: {
        type: String,
        required: true,
    },
    player: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        required: true,
    },
    attackerFiremode: {
        type: Number,
        required: true,
    },
    attackerLoadout: {
        type: Number,
        required: true,
    },
    attackerFaction: {
        type: Number,
        enum: factionArray,
        required: true,
    },
    weapon: {
        type: Number,
        required: true,
    },
    playerLoadout: {
        type: Number,
        enum: loadoutArray,
        required: true,
    },
    playerFaction: {
        type: Number,
        enum: factionArray,
        required: true,
    },
    isHeadshot: {
        type: Boolean,
        required: true,
    },
    isSuicide: {
        type: Boolean,
        required: true,
    },
    isTeamkill: {
        type: Boolean,
        required: true,
    },
    vehicle: {
        type: Number,
    },
});
