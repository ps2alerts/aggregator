import {Faction} from '../constants/faction';
import {World} from '../constants/world';
import Outfit from '../data/Outfit';

export interface CharacterInterface {
    id: string;
    name: string;
    faction: Faction;
    world: World;
    outfit: Outfit | null;
}
