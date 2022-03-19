import {get} from '../utils/env';
import {CharacterManagerOptions, ClientOptions} from 'ps2census';

export default class Census {
    public static readonly streamManagerConfig = {
        worlds: ['all'],
        characters: ['all'],
        logicalAndCharactersWithWorlds: true,
    };

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

    public readonly serviceID: string = get('CENSUS_SERVICE_ID');

    /**
     * @type {ClientOptions} Configuration for PS2 Census aggregator client
     */
    public readonly pcClientConfig: ClientOptions = {
        streamManager: {
            subscription: {
                ...Census.streamManagerConfig,
                eventNames: ['Death', 'FacilityControl', 'MetagameEvent', 'PlayerLogin', 'PlayerLogout', 'GainExperience', 'VehicleDestroy'],
            },
        },
        characterManager: Census.characterManagerConfig,
    };

    public readonly ps2ps4euClientConfig: ClientOptions = {
        streamManager: {
            subscription: {
                ...Census.streamManagerConfig,
                eventNames: ['Death', 'FacilityControl', 'MetagameEvent', 'PlayerLogin', 'PlayerLogout', 'GainExperience', 'VehicleDestroy'],
            },
        },
        characterManager: Census.characterManagerConfig,
    };

    public readonly ps2ps4usClientConfig: ClientOptions = {
        streamManager: {
            subscription: {
                ...Census.streamManagerConfig,
                eventNames: ['Death', 'FacilityControl', 'MetagameEvent', 'PlayerLogin', 'PlayerLogout', 'GainExperience', 'VehicleDestroy'],
            },
        },
        characterManager: Census.characterManagerConfig,
    };
}
