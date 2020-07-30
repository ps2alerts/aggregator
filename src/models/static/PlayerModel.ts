import mongoose, {Document, Schema} from 'mongoose';
import {World} from '../../constants/world';
import {Faction} from '../../constants/faction';

export interface PlayerInterface extends Document {
    name: string;
    world: World;
    faction: Faction;
}

const playerModel: Schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    world: {
        type: Number,
        enum: World,
    },
    faction: {
        type: Number,
        enum: Faction,
    },
});

export default mongoose.model<PlayerInterface>('Player', playerModel);
