import {getLogger} from '../logger';

// This class exists as Census occasionally sends us invalid responses and we must retry them.
export class CensusApiRetryDriver<T> {
    private static readonly logger = getLogger('CensusApiRetryDriver');

    private readonly retryLimit = 3;
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
            return await this.getMethod;
        } catch (err) {
            if (attempts < this.retryLimit) {
                await this.delay(2500);

                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                CensusApiRetryDriver.logger.warn(`[${this.caller}] Census Request failed! Retrying... Attempt #${attempts}. E: ${err.message}`);

                return await this.try(attempts);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                CensusApiRetryDriver.logger.error(`[${this.caller}] Census Request failed after 3 attempts! E: ${err.message}`, 'CensusApiRetryDriver');
            }
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
