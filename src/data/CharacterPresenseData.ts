import {World} from '../constants/world';
import {Zone} from '../constants/zone';
import {Faction} from '../constants/faction';

export default class CharacterPresenseData {
    public readonly character: string;
    public readonly world: World;
    public readonly zone: Zone | null;
    public readonly faction: Faction;
    public readonly lastSeen: Date;

    constructor(
        character: string,
        world: World,
        zone: Zone | null,
        faction: Faction,
        lastSeen: Date,
    ) {
        this.character = character;
        this.world = world;
        this.zone = zone;
        this.faction = faction;
        this.lastSeen = lastSeen;
    }
}
