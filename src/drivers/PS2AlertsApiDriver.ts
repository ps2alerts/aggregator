/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-return */
// Handles all requests to the PS2Alerts API
import MetricsHandler from '../handlers/MetricsHandler';
import {AxiosInstance, AxiosResponse} from 'axios';
import {ExternalRequestDriverInterface} from './ExternalRequestDriverInterface';
import BaseExternalRequestDriver from './BaseExternalRequestDriver';
import {Inject, Injectable} from '@nestjs/common';
import {TYPES} from '../constants/types';

@Injectable()
export class PS2AlertsApiDriver extends BaseExternalRequestDriver implements ExternalRequestDriverInterface {
    constructor(
        @Inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
        metricsHandler: MetricsHandler,
    ) {
        super(
            ps2AlertsApiClient,
            metricsHandler,
            'PS2AlertsApiDriver',
            'ps2alerts_api',
            2,
        );
    }

    public async get(url: string): Promise<AxiosResponse<any, any>> {
        return await this.doRequest(this.wrapRequest('GET', url));
    }

    public async post(url: string, data: any): Promise<AxiosResponse<any, any>> {
        return await this.doRequest(this.wrapRequest('POST', url, data));
    }

    public async put(url: string, data: any): Promise<AxiosResponse<any, any>> {
        return await this.doRequest(this.wrapRequest('PUT', url, data));
    }

    public async patch(url: string, data: any): Promise<AxiosResponse<any, any>> {
        return await this.doRequest(this.wrapRequest('PATCH', url, data));
    }

    public async delete(url: string, data?: any): Promise<AxiosResponse<any, any>> {
        return await this.doRequest(this.wrapRequest('DELETE', url, data));
    }
}
