import {Module} from '@nestjs/common';
import ApiConnectionCheckService from './ApiConnectionCheckService';
import axios from 'axios';
import config from '../../config';
import {TYPES} from '../../constants/types';

@Module({
    providers: [
        ApiConnectionCheckService,
        {
            provide: TYPES.ps2AlertsApiClient,
            useFactory: () => axios.create({
                baseURL: config.internalApi.host,
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/json',
                },
                auth: {
                    username: config.internalApi.username,
                    password: config.internalApi.password,
                },
            }),
        },
    ],
    exports: [TYPES.ps2AlertsApiClient],
})
export default class PS2AlertsApiModule {
}
