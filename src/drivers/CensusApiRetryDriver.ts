import {getLogger} from '../logger';
import {CollectionNames, Conditions, Format} from 'ps2census/dist/rest/types/collection';
import {CensusResponse} from 'ps2census/dist/rest';
import {rest} from 'ps2census';

// This class exists as Census occasionally sends us invalid responses, and we must retry them.
export class CensusApiRetryDriver<T extends CollectionNames> {
    private static readonly logger = getLogger('CensusApiRetryDriver');

    // The below with the combination of CensusClient now having a 10 second timeout (totalling 15s) means we can wait 1 minute for Census to recover.
    private readonly retryLimit = 6;
    private readonly delayTime = 10000; // 1 minute - gives Census 60 seconds of wait time to respond correctly

    constructor(
        private readonly query: rest.GetQuery<T>,
        private readonly filter: Conditions<T>,
        private readonly caller: string,
    ) {}

    public async try(attempts = 0): Promise<CensusResponse<Format<T>> | undefined> {
        attempts++;

        CensusApiRetryDriver.logger.silly(`[${this.caller}] Attempt #${attempts}...`);

        try {
            if (attempts > 2) {
                CensusApiRetryDriver.logger.debug(`[${this.caller}] Attempting to get ${this.query.collection} from Census... Attempt #${attempts}`);
            }

            // Annoyingly Census does respond initially, tricking Axios into thinking it's not timing out. This forces it to time out.
            const res = await this.promiseWithTimeout(this.query.get(this.filter), 10000);

            if (attempts > 1) {
                CensusApiRetryDriver.logger.info(`[${this.caller}] Retry for Census ${this.query.collection} successful at attempt #${attempts}`);
            }

            return res;
        } catch (err) {
            if (attempts === this.retryLimit) {
                if (err instanceof Error) {
                    CensusApiRetryDriver.logger.warn(`[${this.caller}] Census Request ${this.query.collection} failed! E: ${err.message}. Retrying in ${this.delayTime / 1000} seconds...`);
                }

                await this.delay(this.delayTime);

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

    private promiseWithTimeout<T>(
        promise: Promise<T>,
        ms: number,
        timeoutError = new Error('Promise timed out'),
    ): Promise<T> {
        // create a promise that rejects in milliseconds
        const timeout = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(timeoutError);
            }, ms);
        });

        // returns a race between timeout and the passed promise
        return Promise.race<T>([promise, timeout]);
    }
}
