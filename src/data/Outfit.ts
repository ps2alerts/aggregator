import {Faction} from '../constants/faction';
import {World} from '../constants/world';
import outfitMemberExtended from 'ps2census/dist/rest/types/outfitMemberExtended';
import {OutfitInterface} from '../interfaces/OutfitInterface';
import {CharacterWorldOutfitResolved} from '../types/CharacterWorldOutfitResolvedType';

export default class Outfit implements OutfitInterface {
    public id: string;
    public name: string;
    public faction: Faction;
    public world: World;
    public leader: outfitMemberExtended['character_id'];
    public tag?: string | null;

    constructor(outfitData: outfitMemberExtended, character: CharacterWorldOutfitResolved) {
        this.id = outfitData.outfit_id;
        this.name = outfitData.name;
        this.faction = parseInt(character.faction_id, 10);
        this.world = parseInt(character.world_id, 10);
        this.leader = outfitData.leader_character_id;
        this.tag = outfitData.alias ? outfitData.alias : null;
    }
}
