import Character from '../data/Character';
import {World} from '../ps2alerts-constants/world';
import {Faction} from '../ps2alerts-constants/faction';
import {Injectable} from '@nestjs/common';

/* eslint-disable */
export const fakeCharacterCensusData = {
    character_id: '0',
    name: {
        first: 'World',
        first_lower: 'world',
    },
    faction_id: '1',
    battle_rank: {
        percent_to_next: '0.0',
        value: '1',
    },
    head_id: '0',
    title_id: '0',
    times: {
        creation: '1577836800',
        creation_date: '2020-01-01 00:00:00.0',
        last_save: '1577836800',
        last_save_date: '2020-01-01 00:00:00.0',
        last_login: '1577836800',
        last_login_date: '2020-01-01 00:00:00.0',
        login_count: '0',
        minutes_played: '1234',
    },
    certs: {
        earned_points: '1337',
        gifted_points: '1337',
        spent_points: '1337',
        available_points: '1337',
        percent_to_next: '0.0',
    },
    profile_id: '0',
    daily_ribbon: {
        count: '1',
        time: '1577836800',
        date: '2020-01-01 00:00:00.0',
    },
    prestige_level: '0',
    world_id: '19',
    outfit_member: {
        character_id: '1',
        member_since: '1577836800',
        member_since_date: '2020-01-01 00:00:00.0',
        member_rank: 'Grim Reaper',
        member_rank_ordinal: '8',
        outfit_id: "0",
        name: "The Server",
        name_lower: "the server",
        alias: "SERVER",
        alias_lower: "server",
        time_created: '1577836800',
        time_created_date: '2020-01-01 00:00:00.0',
        leader_character_id: "0",
        member_count: "1"
    },
};
/* eslint-enable */

@Injectable()
export default class FakeCharacterFactory {
    private readonly faction: Faction = Faction.NONE;

    // eslint-disable-next-line @typescript-eslint/require-await
    public build(world: World, teamId: Faction | null = null): Character {
        const character = new Character(fakeCharacterCensusData);
        character.world = world;
        character.faction = this.faction;

        if (!teamId) {
            character.teamId = Faction.NONE;
        } else {
            character.teamId = teamId;
        }

        return character;
    }
}
