import {CensusApiRetryDriver} from '../drivers/CensusApiRetryDriver';
import ApplicationException from '../exceptions/ApplicationException';
import {Rest} from 'ps2census';
import Redis from 'ioredis';
import {CensusRegionMapJoinQueryInterface,} from '../interfaces/CensusRegionEndpointInterfaces';
import ZoneDataParser from './ZoneDataParser';
import InstanceAbstract from '../instances/InstanceAbstract';
import {Logger} from '@nestjs/common';
import StatisticsHandler, {MetricTypes} from '../handlers/StatisticsHandler';

export default class CensusMapRegionQueryParser {
    private static readonly logger = new Logger('CensusMapRegionQueryParser');

    constructor(
        private readonly restClient: Rest.Client,
        private readonly caller: string,
        private readonly instance: InstanceAbstract,
        private readonly cacheClient: Redis,
        private readonly zoneDataParser: ZoneDataParser,
        private readonly statisticsHandler: StatisticsHandler,
    ) {}

    public async getMapData(): Promise<CensusRegionMapJoinQueryInterface[]> {
        const cacheKey = `censusMap:W${this.instance.world}:Z${this.instance.zone}`;

        // If in cache, grab it
        if (await this.cacheClient.exists(cacheKey)) {
            CensusMapRegionQueryParser.logger.debug(`${cacheKey} HIT`);
            const data = await this.cacheClient.get(cacheKey);

            if (data) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return JSON.parse(data);
            }
        }

        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        CensusMapRegionQueryParser.logger.debug(`[${this.instance.instanceId}] Grabbing map_region data from Census... (lets hope it doesn't fail...)`);

        const started = new Date();

        const query = this.restClient.getQueryBuilder('map')
            .join({
                type: 'map_region',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                inject_at: 'map_region',
                on: 'Regions.Row.RowData.RegionId',
                to: 'map_region_id',
            });
        /* eslint-disable */
        const filter = {
            world_id: String(this.instance.world),
            zone_ids: String(this.instance.zone),
        };
        /* eslint-enable */

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const apiRequest = new CensusApiRetryDriver(query, filter, 'MetagameInstanceTerritoryStartAction');
        let mapDataFinal: CensusRegionMapJoinQueryInterface[] = [];

        await apiRequest.try().then(async (mapData: CensusRegionMapJoinQueryInterface[]) => {
            await this.statisticsHandler.logTime(started, MetricTypes.CENSUS_MAP_REGION);
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            CensusMapRegionQueryParser.logger.debug(`[${this.instance.instanceId}] Census returned map_region data`);

            if (!mapData || mapData.length === 0) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`[${this.instance.instanceId}] No map data was returned from Census! Cannot start alert properly!`);
            }

            mapDataFinal = mapData;
        }).catch((e) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to query Census for Map Region data! E: ${e.message}`);
        });

        // Cache the data
        await this.cacheClient.setex(cacheKey, 5, JSON.stringify(mapDataFinal));

        return mapDataFinal;
    }
}
