import {Module} from '@nestjs/common';
import {CensusClient, CharacterManager, Rest} from 'ps2census';
import {TYPES} from '../../constants/types';
import axios from 'axios';
import Redis from 'ioredis';
import CensusCacheDriver from './CensusCacheDriver';
import RedisModule from '../redis/RedisModule';
import {ConfigService} from '@nestjs/config';

@Module({
    imports: [RedisModule],
    providers: [
        // Census
        {
            provide: CensusClient,
            useFactory: (
                config: ConfigService,
                characterCache: CensusCacheDriver,
            ) => new CensusClient(config.getOrThrow('census.serviceID'), config.getOrThrow('census.environment'), {
                characterManager: {
                    query: (query) =>
                        query.resolve('world', ['outfit_member_extended', ['outfit_id', 'name', 'alias', 'leader_character_id']])
                            .hide('head_id', 'times', 'certs', 'profile_id', 'title_id', 'daily_ribbon'),
                    retries: 4,
                    cache: characterCache,
                },
                rest: {
                    axios: {
                        timeout: config.get('census.timeout'),
                    },
                },
            }),
            inject: [ConfigService, CensusCacheDriver],
        },
        {
            provide: Rest.Client,
            useFactory: (client: CensusClient) => client.rest,
            inject: [CensusClient],
        },
        {
            provide: CharacterManager,
            useFactory: (client: CensusClient) => client.characterManager,
            inject: [CensusClient],
        },
        // Falcon
        {
            provide: TYPES.falconApiClient,
            useFactory: () => axios.create({
                baseURL: 'https://census.lithafalcon.cc/get/ps2',
                timeout: 5000,
            }),
        },
        {
            provide: CensusCacheDriver,
            useFactory: (redis: Redis) => new CensusCacheDriver(redis, 'cache:character', 86400),
            inject: [Redis],
        },
    ],
    exports: [CensusClient, Rest.Client, CharacterManager, TYPES.falconApiClient],
})
export default class CensusModule {
}
