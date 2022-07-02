import Character from '../data/Character';
import {World} from '../ps2alerts-constants/world';

export interface CharacterBrokerInterface {
    get(characterId: string, world: World): Promise<Character | undefined>;
}
