import {get, getAndTest} from '../utils/env';
import {CharacterManagerOptions, ClientOptions, Rest} from 'ps2census';
import {censusEnvironments} from '../constants/censusEnvironments';
import {pcWorldArray, WorldPC, WorldPS4EU, WorldPS4US} from '../constants/world';
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

    public readonly streamManagerConfig = {
        worlds: this.getWorldsForEnvironment(),
        characters: ['all'],
        logicalAndCharactersWithWorlds: false,
    };

    public readonly serviceID: string = get('CENSUS_SERVICE_ID');
    public readonly censusEnvironment = this.getCensusEnvironment();

    /**
     * @type {ClientOptions} Configuration for PS2 Census aggregator client
     */
    public readonly clientOptions: ClientOptions = {
        streamManager: {
            subscription: {
                ...this.streamManagerConfig,
                eventNames: ['Death', 'FacilityControl', 'GainExperience', 'MetagameEvent', 'PlayerLogin', 'PlayerLogout', 'VehicleDestroy'],
            },
        },
        characterManager: Census.characterManagerConfig,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        rest: Census.restClientOptions,
    };

    public getWorldsForEnvironment(): string[] {
        switch (this.getCensusEnvironment()) {
            case 'ps2':
                return pcWorldArray.map((v) => {
                    return v.toString();
                });
            case 'ps2ps4eu':
                return [WorldPS4EU.CERES.toString()];
            case 'ps2ps4us':
                return [WorldPS4US.GENUDINE.toString()];
            default:
                return [WorldPC.JAEGER.toString()]; // This should never happen but keeps TS happy
        }
    }

    public getCensusEnvironment(): CensusEnvironment {
        return getAndTest('CENSUS_ENVIRONMENT', (v) => [censusEnvironments.pc, censusEnvironments.ps4eu, censusEnvironments.ps4us].includes(v));
    }
}
