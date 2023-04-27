import {Inject, Injectable, Logger, OnModuleInit} from '@nestjs/common';
import {TYPES} from '../../constants/types';
import {AxiosInstance} from 'axios';
import ApplicationException from '../../exceptions/ApplicationException';

@Injectable()
export default class ApiConnectionCheckService implements OnModuleInit {
    private static readonly logger = new Logger(ApiConnectionCheckService.name);
    private readonly maxAttempts = 6;
    private readonly retryTime = 10000;

    constructor(
        @Inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
    ) {
    }

    public async onModuleInit(): Promise<void> {
        ApiConnectionCheckService.logger.log('Booting ApiConnectivityCheckService...');
        await this.tryConnection();
        ApiConnectionCheckService.logger.log('ApiConnectivityCheckService booted!');
    }

    private async tryConnection(attempts = 0): Promise<boolean> {
        attempts++;

        if (attempts > this.maxAttempts) {
            throw new ApplicationException(`PS2Alerts API dead after ${this.maxAttempts} attempts! Killing application!!!`, 'ApiConnectivityBootService');
        }

        ApiConnectionCheckService.logger.debug(`Attempting to contact internal API - Attempt #${attempts}`);

        await this.ps2AlertsApiClient.get('/hello').catch(async (err: Error) => {
            ApiConnectionCheckService.logger.warn(`PS2Alerts API not online! Err: ${err.message} Waiting...`);
            await this.delay(this.retryTime);
            await this.tryConnection(attempts);
        });

        return true;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
