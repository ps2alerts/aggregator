import {Document, Schema} from 'mongoose';
import {Loadout, loadoutArray} from '../../constants/loadout';
import {Faction, factionArray} from '../../constants/faction';
import PS2AlertsInstanceInterface from '../../interfaces/PS2AlertsInstanceInterface';

export interface InstanceDeathSchemaInterface extends Document {
    instance: PS2AlertsInstanceInterface['instanceId'];
    attacker: string;
    player: string;
    timestamp: Date;
    attackerFiremode: number;
    attackerLoadout: number;
    attackerFaction: Faction;
    weapon: number;
    playerLoadout: Loadout;
    playerFaction: Faction;
    isHeadshot: boolean;
    isSuicide: boolean;
    isTeamkill: boolean;
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
}).index(
    {instance: 1, attacker: 1, player: 1, timestamp: 1},
    {unique: true},
);
