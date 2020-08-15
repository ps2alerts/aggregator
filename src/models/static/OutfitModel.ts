import {Document, Schema} from 'mongoose';
import {World} from '../../constants/world';
import {Faction} from '../../constants/faction';
import Character from '../../data/Character';

export interface OutfitSchemaInterface extends Document {
    id: string;
    name: string;
    world: World;
    faction: Faction;
    leader: Character;
}

const outfitSchema: Schema = new Schema({
    id: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    world: {
        type: Number,
        enum: World,
    },
    faction: {
        type: Number,
        enum: Faction,
    },
    outfit: {
        type: String,
    },
}).index(
    {id: 1, name: 1},
    {unique: true},
);
