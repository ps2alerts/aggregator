import {get} from '../utils/env';
import {ClientConfig, rest} from 'ps2census';

export default class Census {
    public static readonly streamManagerConfig = {
        worlds: ['all'],
        characters: ['all'],
        logicalAndCharactersWithWorlds: true,
    };

    public static readonly characterManagerConfig = {
        request: rest.retry(rest.resolve(
            rest.hide(
                rest.character,
                [
                    'head_id',
                    'times',
                    'certs',
                    'profile_id',
                    'title_id',
                    'daily_ribbon',
                ],
            ),
            [
                'world',
                ['outfit_member_extended', ['outfit_id', 'name', 'alias', 'leader_character_id']],
            ],
        )),
    };

    public readonly serviceID: string = get('CENSUS_SERVICE_ID');

    /**
     * @type {ClientConfig} Configuration for PS2 Census aggregator client
     */
    public readonly pcClientConfig: ClientConfig = {
        environment: 'ps2',
        streamManagerConfig: {
            subscription: {
                ...Census.streamManagerConfig,
                eventNames: ['Death', 'FacilityControl', 'MetagameEvent', 'PlayerLogin', 'PlayerLogout', 'GainExperience', 'VehicleDestroy'],
            },
        },
        characterManager: Census.characterManagerConfig,
    };

    public readonly ps2ps4euClientConfig: ClientConfig = {
        environment: 'ps2ps4eu',
        streamManagerConfig: {
            subscription: {
                ...Census.streamManagerConfig,
                eventNames: ['Death', 'FacilityControl', 'MetagameEvent', 'PlayerLogin', 'PlayerLogout', 'GainExperience', 'VehicleDestroy'],
            },
        },
        characterManager: Census.characterManagerConfig,
    };

    public readonly ps2ps4usClientConfig: ClientConfig = {
        environment: 'ps2ps4us',
        streamManagerConfig: {
            subscription: {
                ...Census.streamManagerConfig,
                eventNames: ['Death', 'FacilityControl', 'MetagameEvent', 'PlayerLogin', 'PlayerLogout', 'GainExperience', 'VehicleDestroy'],
            },
        },
        characterManager: Census.characterManagerConfig,
    };
}
