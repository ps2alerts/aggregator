import {Faction} from '../constants/faction';
import {World} from '../constants/world';
import {rest} from 'ps2census';
import {OutfitInterface} from '../interfaces/OutfitInterface';
import {CharacterWorldOutfitLeader} from '../types/CharacterWorldOutfitLeader';

export default class Outfit implements OutfitInterface {
    public id: string;
    public name: string;
    public faction: Faction;
    public world: World;
    public leader: rest.collectionTypes.outfitMemberExtended['character_id'];
    public tag?: string | null;

    constructor(outfitData: rest.collectionTypes.outfitMemberExtended, character: CharacterWorldOutfitLeader) {
        this.id = outfitData.outfit_id;
        this.name = outfitData.name;
        this.faction = parseInt(character.faction_id, 10);
        this.world = parseInt(character.world_id, 10);
        this.leader = outfitData.leader_character_id;
        this.tag = outfitData.alias ? outfitData.alias : null;
    }
}
