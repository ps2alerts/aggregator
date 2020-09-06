import {Faction} from '../constants/faction';
import {World} from '../constants/world';
import Outfit from './Outfit';
import {CharacterInterface} from '../interfaces/CharacterInterface';
import outfitMemberExtended from 'ps2census/dist/rest/types/outfitMemberExtended';
import ApplicationException from '../exceptions/ApplicationException';
import {CharacterWorldOutfitResolved} from '../types/CharacterWorldOutfitResolvedType';

class Character implements CharacterInterface {
    public id: string;
    public name: string;
    public faction: Faction;
    public world: World;
    public outfit: Outfit|null;

    constructor(characterData: CharacterWorldOutfitResolved) {
        this.id = characterData.character_id;
        this.name = characterData.name.first;
        this.faction = parseInt(characterData.faction_id, 10);
        this.world = parseInt(characterData.world_id, 10);

        if (!this.world || isNaN(this.world)) {
            throw new ApplicationException(`World is missing for characterData ${characterData.character_id} - world given: ${characterData.world_id}`);
        }

        this.outfit = null;

        if (characterData.outfit_member) {
            const outfitData: outfitMemberExtended = characterData.outfit_member;

            // Build outfit object and inject
            this.outfit = new Outfit(outfitData, characterData);
        }
    }
}

export default Character;
