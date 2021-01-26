import {getLogger} from '../logger';

// This class exists as Census occasionally sends us invalid responses and we must retry them.
export class CensusApiRetryDriver<T> {
    private static readonly logger = getLogger('CensusApiRetryDriver');

    private readonly retryLimit = 6;
    private readonly delayTime = 5000; // 30 seconds total for waiting for the API to recover
    private readonly getMethod: Promise<T>;
    private readonly caller: string;

    constructor(getMethod: Promise<T>, caller: string) {
        this.getMethod = getMethod;
        this.caller = caller;
    }

    public async try(attempts = 0): Promise<T | undefined> {
        attempts++;

        try {
            CensusApiRetryDriver.logger.debug(`[${this.caller}] Attempting to get data from Census... Attempt #${attempts}`);
            const res = await this.getMethod;

            if (attempts > 1) {
                CensusApiRetryDriver.logger.info(`[${this.caller}] Retry for Census successful at attempt #${attempts}`);
            }

            return res;
        } catch (err) {
            if (attempts < this.retryLimit) {
                await this.delay(this.delayTime);

                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                CensusApiRetryDriver.logger.warn(`[${this.caller}] Census Request failed! Retrying... Attempt #${attempts}. E: ${err.message}`);

                return await this.try(attempts);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                CensusApiRetryDriver.logger.error(`[${this.caller}] Census Request failed after ${this.retryLimit} attempts! E: ${err.message}`, 'CensusApiRetryDriver');
            }
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
