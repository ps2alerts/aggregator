import {Rest} from 'ps2census';
import {promiseTimeout} from '../utils/PromiseTimeout';
import {Logger} from '@nestjs/common';
import StatisticsHandler, {MetricTypes} from '../handlers/StatisticsHandler';
import {METRICS_NAMES} from '../modules/monitoring/MetricsConstants';
import {ConfigService} from '@nestjs/config';

// This class exists as Census occasionally sends us invalid responses, and we must retry them.
export class CensusApiRetryDriver<T extends Rest.CollectionNames> {
    private static readonly logger = new Logger('CensusApiRetryDriver');

    // The below with the combination gives Census 30 seconds to recover before we abort a query.
    private readonly retryLimit = 12;
    private readonly delayTime = 2500;
    private readonly timeoutTime: number;

    constructor(
        private readonly query: Rest.GetQuery<T>,
        private readonly filter: Rest.Conditions<T>,
        private readonly caller: string,
        private readonly statisticsHandler: StatisticsHandler,
        config: ConfigService,
    ) {
        this.timeoutTime = config.get('census.timeout'); // Maximum Census tolerance
    }

    public async try(attempts = 0): Promise<Rest.CensusResponse<Rest.Format<T>> | undefined> {
        attempts++;

        CensusApiRetryDriver.logger.verbose(`[${this.caller}] Attempt #${attempts}...`);

        const started = new Date();

        try {
            if (attempts > 2) {
                CensusApiRetryDriver.logger.debug(`[${this.caller}] Attempting to get ${this.query.collection} from Census... Attempt #${attempts}`);
                this.statisticsHandler.increaseCounter(METRICS_NAMES.EXTERNAL_REQUESTS, {provider: 'census', endpoint: this.query.collection, result: 'retry'});
            }

            // Annoyingly Census does respond initially, tricking Axios into thinking it's not timing out. This forces it to time out.
            const res = await promiseTimeout(this.query.get(this.filter), this.timeoutTime);

            if (attempts > 1) {
                CensusApiRetryDriver.logger.log(`[${this.caller}] Retry for Census ${this.query.collection} successful at attempt #${attempts}`);
                this.statisticsHandler.increaseCounter(METRICS_NAMES.EXTERNAL_REQUESTS, {provider: 'census', endpoint: this.query.collection, result: 'retry_success'});
            }

            await this.statisticsHandler.logMetric(started, this.metricKey(this.caller), true, attempts > 1);
            this.statisticsHandler.increaseCounter(METRICS_NAMES.EXTERNAL_REQUESTS, {provider: 'census', endpoint: this.query.collection, result: 'success'});

            return res;
        } catch (err) {
            if (attempts < this.retryLimit) {
                if (err instanceof Error) {
                    CensusApiRetryDriver.logger.warn(`[${this.caller}] Census Request "${this.query.collection}" failed! E: ${err.message}. Retrying in ${this.delayTime / 1000} seconds...`);
                    await this.statisticsHandler.logMetric(started, this.metricKey(this.caller), false, true);
                    this.statisticsHandler.increaseCounter(METRICS_NAMES.EXTERNAL_REQUESTS, {provider: 'census', endpoint: this.query.collection, result: 'retry'});
                }

                await this.delay(this.delayTime);

                return await this.try(attempts);
            } else {
                if (err instanceof Error) {
                    CensusApiRetryDriver.logger.error(`[${this.caller}] Census Request "${this.query.collection}" failed after ${this.retryLimit} attempts! E: ${err.message}`, 'CensusApiRetryDriver');
                    await this.statisticsHandler.logMetric(started, this.metricKey(this.caller), false, true);
                    this.statisticsHandler.increaseCounter(METRICS_NAMES.EXTERNAL_REQUESTS, {provider: 'census', endpoint: this.query.collection, result: 'error'});
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
