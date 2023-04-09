import {Module} from '@nestjs/common';
import ApiConnectionCheckService from './ApiConnectionCheckService';
import axios from 'axios';
import {TYPES} from '../../constants/types';
import {ConfigService} from '@nestjs/config';

@Module({
    providers: [
        ApiConnectionCheckService,
        {
            provide: TYPES.ps2AlertsApiClient,
            useFactory: (config: ConfigService) => axios.create({
                baseURL: config.get('internalApi.host'),
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/json',
                },
                auth: {
                    username: config.get('internalApi.username'),
                    password: config.get('internalApi.password'),
                },
            }),
            inject: [ConfigService],
        },
    ],
    exports: [TYPES.ps2AlertsApiClient],
})
export default class PS2AlertsApiModule {
}
