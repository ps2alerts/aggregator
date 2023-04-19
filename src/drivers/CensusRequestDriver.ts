import {Rest} from 'ps2census';
import {CensusApiRetryDriver} from './CensusApiRetryDriver';
import {METRICS_NAMES} from '../modules/metrics/MetricsConstants';
import MetricsHandler from '../handlers/MetricsHandler';
import {ConfigService} from '@nestjs/config';
import {Format} from 'ps2census/dist/rest';

export class CensusRequestDriver {
    constructor(
        private readonly restClient: Rest.Client,
        private readonly metricsHandler: MetricsHandler,
        private readonly config: ConfigService,
    ) {
    }

    public async getItem(itemId: number): Promise<Format<'item'>> {
        const query = this.restClient.getQueryBuilder('item')
            .limit(1);
        const filter = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            item_id: String(itemId),
        };

        const timer = this.metricsHandler.getHistogram(METRICS_NAMES.EXTERNAL_REQUESTS_COUNT, {provider: 'census', endpoint: '/item'});

        // Grab the item data from Census
        const apiRequest = new CensusApiRetryDriver(query, filter, 'CensusRequestDriver:getItem', this.metricsHandler, this.config);
        const items = await apiRequest.try();
        timer();

        if (!items[0]) {
            this.metricsHandler.increaseCounter(METRICS_NAMES.EXTERNAL_REQUESTS_COUNT, {provider: 'census', endpoint: '/item', result: 'empty'});

            return null;
        }

        return items[0];
    }
}
