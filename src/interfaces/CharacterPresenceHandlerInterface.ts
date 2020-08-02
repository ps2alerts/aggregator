import {World} from '../constants/world';
import PopulationData from '../data/PopulationData';

export default interface CharacterPresenceHandlerInterface {
    update(character: string, world: World, zone: number|null): Promise<boolean>;

    delete(character: string): Promise<boolean>;

    collate(): Map<string, PopulationData>;
}
