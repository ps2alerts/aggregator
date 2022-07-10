import PopulationData from '../data/PopulationData';
import Character from '../data/Character';
import PS2AlertsInstanceInterface from './PS2AlertsInstanceInterface';

export default interface CharacterPresenceHandlerInterface {
    update(character: Character, instance: PS2AlertsInstanceInterface): Promise<boolean>;

    delete(character: Character): Promise<boolean>;

    collate(): Promise<Map<string, PopulationData>>;
}
