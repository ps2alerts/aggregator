import {Rest} from 'ps2census';
import {promiseTimeout} from '../utils/PromiseTimeout';
import {Logger} from '@nestjs/common';
import MetricsHandler, {MetricTypes} from '../handlers/MetricsHandler';
import {METRICS_NAMES} from '../modules/metrics/MetricsConstants';
import {ConfigService} from '@nestjs/config';

// This class exists as Census occasionally sends us invalid responses, and we must retry them.
export class CensusApiRetryDriver<T extends Rest.CollectionNames> {
    private static readonly logger = new Logger('CensusApiRetryDriver');

    // The below with the combination gives Census 120 seconds to recover before we abort a query.
    private readonly retryLimit = 4;
    private readonly delayTime = 2500;
    private readonly timeoutTime: number; // Maximum Census tolerance 30s
    private readonly endpoint: string;

    constructor(
        private readonly query: Rest.GetQuery<T>,
        private readonly filter: Rest.Conditions<T>,
        private readonly caller: string,
        private readonly metricsHandler: MetricsHandler,
        config: ConfigService,
    ) {
        this.timeoutTime = config.get('census.timeout'); // Maximum Census tolerance
        this.endpoint = `/${this.query.collection}`;
    }

    public async try(attempts = 0): Promise<Rest.CensusResponse<Rest.Format<T>> | undefined> {
        attempts++;

        CensusApiRetryDriver.logger.verbose(`[${this.caller}] Attempt #${attempts}...`);

        const timer = this.metricsHandler.getHistogram(METRICS_NAMES.EXTERNAL_REQUESTS_HISTOGRAM, {provider: 'census', endpoint: this.endpoint});

        try {
            if (attempts > 2) {
                CensusApiRetryDriver.logger.debug(`[${this.caller}] Attempting to get ${this.endpoint} from Census... Attempt #${attempts}`);
                this.metricsHandler.increaseCounter(METRICS_NAMES.EXTERNAL_REQUESTS_COUNT, {provider: 'census', endpoint: this.query.collection, result: 'retry'});
            }

            // Annoyingly Census does respond initially, tricking Axios into thinking it's not timing out. This forces it to time out.
            const res = await promiseTimeout(this.query.get(this.filter), this.timeoutTime);
            timer();

            if (attempts > 1) {
                CensusApiRetryDriver.logger.log(`[${this.caller}] Retry for Census ${this.endpoint} successful at attempt #${attempts}`);
                this.metricsHandler.increaseCounter(METRICS_NAMES.EXTERNAL_REQUESTS_COUNT, {provider: 'census', endpoint: this.query.collection, result: 'retry_success'});
            }

            this.metricsHandler.increaseCounter(METRICS_NAMES.EXTERNAL_REQUESTS_COUNT, {provider: 'census', endpoint: this.query.collection, result: 'success'});

            return res;
        } catch (err) {
            if (attempts < this.retryLimit) {
                if (err instanceof Error) {
                    CensusApiRetryDriver.logger.warn(`[${this.caller}] Census Request "${this.endpoint}" failed! E: ${err.message}. Retrying in ${this.delayTime / 1000} seconds...`);
                    this.metricsHandler.increaseCounter(METRICS_NAMES.EXTERNAL_REQUESTS_COUNT, {provider: 'census', endpoint: this.query.collection, result: 'retry'});
                }

                timer();

                await this.delay(this.delayTime);

                return await this.try(attempts);
            } else {
                if (err instanceof Error) {
                    CensusApiRetryDriver.logger.error(`[${this.caller}] Census Request "${this.endpoint}" failed after ${this.retryLimit} attempts! E: ${err.message}`, 'CensusApiRetryDriver');
                    this.metricsHandler.increaseCounter(METRICS_NAMES.EXTERNAL_REQUESTS_COUNT, {provider: 'census', endpoint: this.query.collection, result: 'error'});
                }
            }
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private metricKey(caller: string) {
        switch (caller) {
            case 'CensusMapRegionQueryParser':
                return MetricTypes.CENSUS_MAP_REGION;

            case 'ItemBroker':
                return MetricTypes.CENSUS_ITEM;
        }

        return null;
    }
}
