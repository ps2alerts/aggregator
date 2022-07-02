import {Faction} from '../ps2alerts-constants/faction';
import {World} from '../ps2alerts-constants/world';
import {OutfitInterface} from '../interfaces/OutfitInterface';
import {CharacterWorldOutfitLeader} from '../types/CharacterWorldOutfitLeader';
import {Rest} from 'ps2census';

export default class Outfit implements OutfitInterface {
    public id: string;
    public name: string;
    public faction: Faction;
    public world: World;
    public leader: string;
    public tag?: string | null;

    constructor(outfitData: Rest.Format<'outfit_member_extended'>, character: CharacterWorldOutfitLeader) {
        this.id = outfitData.outfit_id;
        this.name = outfitData.name;
        this.faction = parseInt(character.faction_id, 10);
        this.world = parseInt(character.world_id, 10);
        this.leader = outfitData.leader_character_id;
        this.tag = outfitData.alias ? outfitData.alias : null;
    }
}
