import PopulationData from '../data/PopulationData';
import Character from '../data/Character';

export default interface CharacterPresenceHandlerInterface {
    update(character: Character, zone: number|null): Promise<boolean>;

    delete(characterId: string): Promise<boolean>;

    collate(): Map<string, PopulationData>;

    init(): Promise<void>;
}
