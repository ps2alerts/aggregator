import {Document, Schema} from 'mongoose';
import {World, worldArray} from '../constants/world';
import {Zone, zoneArray} from '../constants/zone';
import {Faction, factionArray} from '../constants/faction';

export interface CharacterPresenceSchemaInterface extends Document {
    character: string;
    world: World;
    zone: Zone|null;
    faction: Faction;
    lastSeen: Date;
}

export const characterPresenceSchema: Schema = new Schema({
    character: {
        type: String,
        required: true,
    },
    world: {
        type: Number,
        enum: worldArray,
        required: true,
    },
    zone: {
        type: Number,
        enum: zoneArray,
    },
    faction: {
        type: Number,
        enum: factionArray,
        required: true,
    },
    lastSeen: {
        type: Date,
        required: true,
    },
}).index(
    {character: 1, world: 1},
    {unique: true},
);
