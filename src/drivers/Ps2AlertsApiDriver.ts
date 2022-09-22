/* eslint-disable @typescript-eslint/naming-convention */
import axios, {AxiosInstance} from 'axios';
import {Injectable} from '@nestjs/common';
import config from '../config';

@Injectable()
export class Ps2AlertsApiDriver {
    private readonly httpClient: AxiosInstance;

    constructor() {
        const apiConfig = config.internalApi;
        this.httpClient = axios.create({
            baseURL: apiConfig.host,
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json',
            },
            auth: {
                username: apiConfig.username,
                password: apiConfig.password,
            },
        });
    }

    public getClient(): AxiosInstance {
        return this.httpClient;
    }
}
