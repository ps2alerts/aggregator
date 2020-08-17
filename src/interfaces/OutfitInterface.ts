import {Faction} from '../constants/faction';
import {World} from '../constants/world';
import Character from '../data/Character';

export interface OutfitInterface {
    id: string;
    name: string;
    faction: Faction;
    world: World;
    leader: Character['id'];
    tag?: string | null;
}
