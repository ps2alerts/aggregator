import {Document, Schema} from 'mongoose';
import {World} from '../../constants/world';
import {Faction} from '../../constants/faction';
import Outfit from '../../data/Outfit';

export interface CharacterSchemaInterface extends Document {
    id: string;
    name: string;
    world: World;
    faction: Faction;
    outfit?: Outfit['id'];
}

const characterSchema: Schema = new Schema({
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
