import axios, {AxiosInstance} from 'axios';
import {injectable} from 'inversify';
import config from '../config';

@injectable()
export class Ps2AlertsApiDriver {
    private readonly httpClient: AxiosInstance;

    constructor() {
        const apiConfig = config.internalApi;
        this.httpClient = axios.create({
            baseURL: apiConfig.host,
            timeout: 30000,
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
