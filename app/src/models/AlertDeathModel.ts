import mongoose, {Document, Schema} from 'mongoose';
import {AlertInterface} from './AlertModel';
import {Loadout} from '../constants/loadout';
import {PlayerInterface} from './static/PlayerModel';

export interface AlertDeathInterface extends Document {
    alert: AlertInterface['_id'];
    attacker: PlayerInterface['_id'];
    player: PlayerInterface['_id'];
    attackerFiremode: number;
    attackerLoadout: number;
    weapon: number;
    playerLoadout: Loadout;
    isCritical: boolean;
    isHeadshot: boolean;
    isSuicide: boolean;
    vehicle: number;
}

const alertDeathModel: Schema = new Schema({
    alert: {
        type: Schema.Types.ObjectId,
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
    isCritical: {
        type: Boolean,
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

export default mongoose.model<AlertDeathInterface>('AlertDeath', alertDeathModel);
