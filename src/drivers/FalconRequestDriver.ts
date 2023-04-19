/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-return */
// Handles all requests to the PS2Alerts API
import MetricsHandler from '../handlers/MetricsHandler';
import {AxiosInstance, AxiosResponse} from 'axios';
import {ExternalRequestDriverInterface} from './ExternalRequestDriverInterface';
import BaseExternalRequestDriver from './BaseExternalRequestDriver';
import {Inject, Injectable} from '@nestjs/common';
import {TYPES} from '../constants/types';

@Injectable()
export class FalconRequestDriver extends BaseExternalRequestDriver implements ExternalRequestDriverInterface {
    constructor(
        @Inject(TYPES.falconApiClient) private readonly falconApiClient: AxiosInstance,
        metricsHandler: MetricsHandler,
    ) {
        super(falconApiClient, metricsHandler, 'FalconRequestDriver', 'falcon');
    }

    public async get(url: string, data?: any): Promise<AxiosResponse<any, any>> {
        return await this.doRequest(this.wrapRequest('GET', url, data));
    }

    // Unused
    public async post(url: string, data: any): Promise<AxiosResponse<any, any>> {
        return await this.doRequest(this.wrapRequest('POST', url, data));
    }

    // Unused
    public async put(url: string, data: any): Promise<AxiosResponse<any, any>> {
        return await this.doRequest(this.wrapRequest('PUT', url, data));
    }

    // Unused
    public async patch(url: string, data: any): Promise<AxiosResponse<any, any>> {
        return await this.doRequest(this.wrapRequest('PATCH', url, data));
    }

    // Unused
    public async delete(url: string, data: any): Promise<AxiosResponse<any, any>> {
        return await this.doRequest(this.wrapRequest('DELETE', url, data));
    }
}
