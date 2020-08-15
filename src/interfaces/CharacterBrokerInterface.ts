import Character from '../data/Character';

export interface CharacterBrokerInterface {
    get(characterId: string): Promise<Character>;
}
