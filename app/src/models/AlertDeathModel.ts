import {Document, Schema} from 'mongoose';
import {AlertSchemaInterface} from './AlertModel';
import {Loadout} from '../constants/loadout';
import {PlayerInterface} from './static/PlayerModel';

export interface AlertDeathSchemaInterface extends Document {
    alert: AlertSchemaInterface['alertId'];
    attacker: PlayerInterface['_id'];
    player: PlayerInterface['_id'];
    timestamp: number;
    attackerFiremode: number;
    attackerLoadout: number;
    weapon: number;
    playerLoadout: Loadout;
    isHeadshot: boolean;
    isSuicide: boolean;
    vehicle: number;
}

export const alertDeathSchema: Schema = new Schema({
    alert: {
        type: String,
        required: true,
    },
    attacker: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    player: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    timestamp: {
        type: Number,
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
    weapon: {
        type: Number,
        required: true,
    },
    playerLoadout: {
        type: Number,
        enum: Loadout,
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
    vehicle: {
        type: Number,
    },
});
