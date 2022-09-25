import {Rest} from 'ps2census';
import {promiseTimeout} from '../utils/PromiseTimeout';
import {Logger} from '@nestjs/common';

// This class exists as Census occasionally sends us invalid responses, and we must retry them.
export class CensusApiRetryDriver<T extends Rest.CollectionNames> {
    private static readonly logger = new Logger('CensusApiRetryDriver');

    // The below with the combination gives Census 30 seconds to recover before we abort a query.
    private readonly retryLimit = 12;
    private readonly delayTime = 2500;

    constructor(
        private readonly query: Rest.GetQuery<T>,
        private readonly filter: Rest.Conditions<T>,
        private readonly caller: string,
    ) {}

    public async try(attempts = 0): Promise<Rest.CensusResponse<Rest.Format<T>> | undefined> {
        attempts++;

        CensusApiRetryDriver.logger.verbose(`[${this.caller}] Attempt #${attempts}...`);

        try {
            if (attempts > 2) {
                CensusApiRetryDriver.logger.debug(`[${this.caller}] Attempting to get ${this.query.collection} from Census... Attempt #${attempts}`);
            }

            // Annoyingly Census does respond initially, tricking Axios into thinking it's not timing out. This forces it to time out.
            const res = await promiseTimeout(this.query.get(this.filter), 10000);

            if (attempts > 1) {
                CensusApiRetryDriver.logger.log(`[${this.caller}] Retry for Census ${this.query.collection} successful at attempt #${attempts}`);
            }

            return res;
        } catch (err) {
            if (attempts < this.retryLimit) {
                if (err instanceof Error) {
                    CensusApiRetryDriver.logger.warn(`[${this.caller}] Census Request "${this.query.collection}" failed! E: ${err.message}. Retrying in ${this.delayTime / 1000} seconds...`);
                }

                await this.delay(this.delayTime);

                return await this.try(attempts);
            } else {
                if (err instanceof Error) {
                    CensusApiRetryDriver.logger.error(`[${this.caller}] Census Request "${this.query.collection}" failed after ${this.retryLimit} attempts! E: ${err.message}`, 'CensusApiRetryDriver');
                }
            }
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
