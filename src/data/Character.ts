import {Faction} from '../constants/faction';
import {World} from '../constants/world';
import Outfit from './Outfit';
import {CharacterInterface} from '../interfaces/CharacterInterface';
import ApplicationException from '../exceptions/ApplicationException';
import {CharacterWorldOutfitLeader} from '../types/CharacterWorldOutfitLeader';
import FakeOutfitFactory from '../constants/fakeOutfit';

class Character implements CharacterInterface {
    public id: string;
    public name: string;
    public faction: Faction;
    public world: World;
    public battleRank: number;
    public asp: number;
    public adjustedBattleRank: number;
    public outfit: Outfit | null;

    constructor(characterData: CharacterWorldOutfitLeader) {
        this.id = characterData.character_id;
        this.name = characterData.name.first;
        this.faction = parseInt(characterData.faction_id, 10);
        this.world = parseInt(characterData.world_id, 10);

        if (!this.world || isNaN(this.world)) {
            throw new ApplicationException(`World is missing for character ${characterData.character_id} - world given: ${characterData.world_id}`);
        }

        this.battleRank = parseInt(characterData.battle_rank.value, 10);
        this.asp = parseInt(characterData.prestige_level, 10);
        let aspBRs = 0;

        if (Number.isSafeInteger(this.asp)){
            aspBRs += this.asp * 100;

            if (this.asp > 0){
                aspBRs += 20;
            }
        }

        this.adjustedBattleRank = this.battleRank + aspBRs;

        if (characterData.outfit_member) {
            this.outfit = new Outfit(characterData.outfit_member, characterData);
        } else {
            this.outfit = new FakeOutfitFactory(this.faction).build();
        }
    }
}

export default Character;
