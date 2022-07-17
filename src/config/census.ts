import {get, getAndTest} from '../utils/env';
import {CharacterManagerOptions, ClientOptions, Rest} from 'ps2census';
import {censusEnvironments} from '../ps2alerts-constants/censusEnvironments';
import {CensusEnvironment} from '../types/CensusEnvironment';

export default class Census {
    public static readonly characterManagerConfig: CharacterManagerOptions = {
        query: (query) => query.resolve('world', ['outfit_member_extended', ['outfit_id', 'name', 'alias', 'leader_character_id']])
            .hide(
                'head_id',
                'times',
                'certs',
                'profile_id',
                'title_id',
                'daily_ribbon',
            ),
        retries: 3,
    };

    public static readonly restClientOptions: Rest.ClientOptions = {
        axios: {
            timeout: 10005,
        },
    };

    public readonly serviceID: string = get('CENSUS_SERVICE_ID');
    public readonly censusEnvironment = this.getCensusEnvironment();
    public readonly metagameEnabled = false; // Set this to false to ignore new alerts coming in

    /**
     * @type {ClientOptions} Configuration for PS2 Census aggregator client
     */
    public readonly clientOptions: ClientOptions = {
        characterManager: Census.characterManagerConfig,
        rest: Census.restClientOptions,
    };

    public getCensusEnvironment(): CensusEnvironment {
        return getAndTest('CENSUS_ENVIRONMENT', (v) => [censusEnvironments.pc, censusEnvironments.ps4eu, censusEnvironments.ps4us].includes(v));
    }
}
