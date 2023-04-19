/* eslint-disable @typescript-eslint/no-explicit-any */
import {ExternalRequestWrapperInterface} from './ExternalRequestDriverInterface';
import {AxiosInstance, AxiosResponse} from 'axios';
import ApplicationException from '../exceptions/ApplicationException';
import {METRICS_NAMES} from '../modules/metrics/MetricsConstants';
import MetricsHandler from '../handlers/MetricsHandler';
import {Logger} from '@nestjs/common';

export default abstract class BaseExternalRequestDriver {
    private static readonly logger = new Logger('BaseExternalRequestDriver');
    private readonly caller: string;
    private readonly provider: string;

    protected constructor(
        private readonly apiClient: AxiosInstance,
        private readonly metricsHandler: MetricsHandler,
        caller: string,
        provider: string,
    ) {
        this.caller = caller;
        this.provider = provider;
    }

    protected wrapRequest(operation: 'GET' | 'POST' | 'PUT' |'PATCH' | 'DELETE', url: string, data?: any): ExternalRequestWrapperInterface {
        let request: Promise<AxiosResponse>;

        switch (operation) {
            case 'GET':
                request = this.apiClient.get(url, data);
                break;
            case 'POST':
                request = this.apiClient.post(url, data);
                break;
            case 'PUT':
                request = this.apiClient.put(url, data);
                break;
            case 'PATCH':
                request = this.apiClient.patch(url, data);
                break;
            case 'DELETE':
                request = this.apiClient.delete(url, data);
                break;

            default:
                throw new ApplicationException('Attempted to get a request wrapper for an invalid operation type');
        }

        return {
            timer: this.metricsHandler.getHistogram(METRICS_NAMES.EXTERNAL_REQUESTS_HISTOGRAM, {provider: this.provider, endpoint: url}),
            url,
            request,
        };
    }

    protected doRequest(wrapper: ExternalRequestWrapperInterface): any{
        return wrapper.request.then((response: AxiosResponse) => {
            wrapper.timer();
            this.metricsHandler.increaseCounter(METRICS_NAMES.EXTERNAL_REQUESTS_COUNT, {provider: this.provider, endpoint: wrapper.url, result: 'success'});
            return response;
        }).catch((err) => {
            wrapper.timer();
            this.metricsHandler.increaseCounter(METRICS_NAMES.EXTERNAL_REQUESTS_COUNT, {provider: this.provider, endpoint: wrapper.url, result: 'error'});

            if (err instanceof Error) {
                BaseExternalRequestDriver.logger.error(`[${this.caller}] - External API call failed for ${wrapper.url} endpoint! Err: ${err.message}`);
            }
        });
    }
}
