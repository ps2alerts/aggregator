import {Faction} from '../ps2alerts-constants/faction';
import {World} from '../ps2alerts-constants/world';
import Outfit from '../data/Outfit';

export interface CharacterInterface {
    id: string;
    name: string;
    faction: Faction;
    world: World;
    outfit: Outfit | null;
}
