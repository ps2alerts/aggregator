import Character from '../data/Character';
import {World} from '../constants/world';

export interface CharacterBrokerInterface {
    get(characterId: string, world: World): Promise<Character>;
}
