import {Document, Schema} from 'mongoose';
import {Loadout, loadoutArray} from '../../constants/loadout';
import PS2AlertsInstanceInterface from '../../interfaces/PS2AlertsInstanceInterface';
import Character from '../../data/Character';
import {Kill} from 'ps2census/dist/client/events/Death';

export interface InstanceDeathSchemaInterface extends Document {
    instance: PS2AlertsInstanceInterface['instanceId'];
    attacker: Character['id'];
    character: Character['id'];
    timestamp: Date;
    attackerFiremode: number;
    attackerLoadout: Loadout;
    weapon: number;
    characterLoadout: Loadout;
    isHeadshot: boolean;
    killType: Kill;
    vehicle: number;
}

export const instanceDeathSchema: Schema = new Schema({
    instance: {
        type: String,
        required: true,
    },
    attacker: {
        type: String,
        required: true,
    },
    character: {
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
        enum: loadoutArray,
        required: true,
    },
    weapon: {
        type: Number,
        required: true,
    },
    characterLoadout: {
        type: Number,
        enum: loadoutArray,
        required: true,
    },
    isHeadshot: {
        type: Boolean,
        required: true,
    },
    killType: {
        type: Number,
        required: true,
    },
    vehicle: {
        type: Number,
    },
}).index(
    {instance: 1, attacker: 1, character: 1, timestamp: 1},
    {unique: true},
);
