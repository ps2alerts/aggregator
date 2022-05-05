import {inject, injectable} from 'inversify';
import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {TYPES} from '../../constants/types';
import {AxiosInstance} from 'axios';
import ApplicationException from '../../exceptions/ApplicationException';

@injectable()
export default class ApiConnectionCheckService implements ServiceInterface {
    public readonly bootPriority = 1;
    private static readonly logger = getLogger('ApiConnectivityBootService');
    private readonly maxAttempts = 6;
    private readonly retryTime = 10000;

    constructor(
        @inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
    ) {}

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        ApiConnectionCheckService.logger.info('Booting ApiConnectivityBootService...');
        await this.tryConnection();
        ApiConnectionCheckService.logger.info('ApiConnectivityBootService booted!');
    }

    // Not implemented
    // eslint-disable-next-line @typescript-eslint/require-await
    public async start(): Promise<void> {}

    // Not implemented
    // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-empty-function
    public async terminate(): Promise<void> {}

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
