import {getLogger} from '../logger';
import {CollectionNames, Conditions, Format} from 'ps2census/dist/rest/types/collection';
import {CensusResponse} from 'ps2census/dist/rest';
import {rest} from 'ps2census';

// This class exists as Census occasionally sends us invalid responses and we must retry them.
export class CensusApiRetryDriver<T extends CollectionNames> {
    private static readonly logger = getLogger('CensusApiRetryDriver');

    // The below with the combination of CensusClient now having a 10 second timeout (totalling 15s) means we can wait 2 minutes for Census to recover.
    private readonly retryLimit = 8;
    private readonly delayTime = 5000; // 30 seconds total for waiting for the API to recover

    constructor(
        private readonly query: rest.GetQuery<T>,
        private readonly filter: Conditions<T>,
        private readonly caller: string,
    ) {}

    public async try(attempts = 0): Promise<CensusResponse<Format<T>> | undefined> {
        attempts++;

        CensusApiRetryDriver.logger.debug(`[${this.caller}] Attempt #${attempts}...`);

        try {
            if (attempts > 2) {
                CensusApiRetryDriver.logger.debug(`[${this.caller}] Attempting to get ${this.query.collection} from Census... Attempt #${attempts}`);
            }

            const res = await this.query.get(this.filter);

            if (attempts > 1) {
                CensusApiRetryDriver.logger.info(`[${this.caller}] Retry for Census ${this.query.collection} successful at attempt #${attempts}`);
            }

            return res;
        } catch (err) {
            if (attempts < this.retryLimit) {
                await this.delay(this.delayTime);

                if (err instanceof Error) {
                    CensusApiRetryDriver.logger.warn(`[${this.caller}] Census Request ${this.query.collection} failed! Retrying... Attempt #${attempts}. E: ${err.message}`);
                }

                return await this.try(attempts);
            } else {
                if (err instanceof Error) {
                    CensusApiRetryDriver.logger.error(`[${this.caller}] Census Request ${this.query.collection} failed after ${this.retryLimit} attempts! E: ${err.message}`, 'CensusApiRetryDriver');
                }
            }
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
