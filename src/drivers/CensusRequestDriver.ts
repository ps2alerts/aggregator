import {CensusApiRetryDriver} from './CensusApiRetryDriver';
import {METRICS_NAMES} from '../modules/metrics/MetricsConstants';
import MetricsHandler from '../handlers/MetricsHandler';
import {ConfigService} from '@nestjs/config';
import {Rest} from 'ps2census';
import {Format} from 'ps2census/dist/rest';
import {Injectable} from '@nestjs/common';
import {CensusRegionMapJoinQueryInterface} from '../interfaces/CensusRegionEndpointInterfaces';
import ApplicationException from '../exceptions/ApplicationException';
import {World} from '../ps2alerts-constants/world';
import {Zone} from '../ps2alerts-constants/zone';

@Injectable()
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
            item_id: String(itemId),
        };

        const timer = this.metricsHandler.getHistogram(METRICS_NAMES.EXTERNAL_REQUESTS_HISTOGRAM, {provider: 'census', endpoint: '/item'});

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

    public async getMap(world: World, zone: Zone): Promise<CensusRegionMapJoinQueryInterface> {
        const query = this.restClient.getQueryBuilder('map')
            .join({
                type: 'map_region',
                inject_at: 'map_region',
                on: 'Regions.Row.RowData.RegionId',
                to: 'map_region_id',
            });
        const filter = {
            world_id: String(world),
            zone_ids: String(zone),
        };

        const timer = this.metricsHandler.getHistogram(METRICS_NAMES.EXTERNAL_REQUESTS_HISTOGRAM, {provider: 'census', endpoint: '/map'});

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const apiRequest = new CensusApiRetryDriver(query, filter, 'CensusRequestDriver:getMap', this.metricsHandler, this.config);

        try {
            // Unfortunately there is no real means to force ps2census to return the data in the interface we expect with a join, so we have to ignore it here.
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const mapData: CensusRegionMapJoinQueryInterface = await apiRequest.try();

            timer();

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (!mapData[0].Regions?.Row && mapData[0].Regions.Row.length === 0) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Census returned empty map data for zone ${zone}!`);
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return mapData[0];
        } catch (err) {
            timer();

            if (err instanceof Error) {
                throw new ApplicationException(`Unable to query Census for Map Region data! E: ${err.message}`);
            }
        }

        throw new ApplicationException('Unknown execution path in getMap!');
    }
}
