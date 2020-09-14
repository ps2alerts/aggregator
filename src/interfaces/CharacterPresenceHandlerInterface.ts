import PopulationData from '../data/PopulationData';
import Character from '../data/Character';

export default interface CharacterPresenceHandlerInterface {
    update(character: Character, zone: number): Promise<boolean>;

    delete(character: Character): Promise<boolean>;

    collate(): Promise<Map<string, PopulationData>>;
}
