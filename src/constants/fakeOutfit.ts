import {Faction} from './faction';
import Outfit from '../data/Outfit';
import {fakeCharacterCensusData} from './fakeCharacter';

/* eslint-disable */
export const fakeOutfitCensusData = {
    character_id: '0',
    member_since: '0',
    member_since_date: '0',
    member_rank: '0',
    member_rank_ordinal: '0',
    outfit_id: '1234',
    name: '-- Outfitless players --',
    name_lower: '-- outfitless players --',
    alias: '',
    alias_lower: '',
    time_created: '0',
    time_created_date: '0',
    leader_character_id: '0',
    member_count: '0',
};
/* eslint-enable */

export default class FakeOutfitFactory {
    private readonly faction: string;
    constructor(faction: Faction) {
        this.faction = faction.toString();
    }

    public build(): Outfit {
        const fakeCharacterData = fakeCharacterCensusData;
        fakeOutfitCensusData.outfit_id = this.faction;
        fakeCharacterData.faction_id = this.faction;
        return new Outfit(fakeOutfitCensusData, fakeCharacterData);
    }
}
