import ApplicationException from '../exceptions/ApplicationException';
import {Rest} from 'ps2census';
import Redis from 'ioredis';
import {CensusRegionMapJoinQueryInterface} from '../interfaces/CensusRegionEndpointInterfaces';
import ZoneDataParser from './ZoneDataParser';
import InstanceAbstract from '../instances/InstanceAbstract';
import {Logger} from '@nestjs/common';
import MetricsHandler from '../handlers/MetricsHandler';
import {METRICS_NAMES} from '../modules/metrics/MetricsConstants';
import {CensusRequestDriver} from '../drivers/CensusRequestDriver';

export default class CensusMapRegionQueryParser {
    private static readonly logger = new Logger('CensusMapRegionQueryParser');

    constructor(
        private readonly restClient: Rest.Client,
        private readonly caller: string,
        private readonly instance: InstanceAbstract,
        private readonly cacheClient: Redis,
        private readonly zoneDataParser: ZoneDataParser,
        private readonly metricsHandler: MetricsHandler,
        private readonly censusRequestDriver: CensusRequestDriver,
    ) {}

    public async getMapData(): Promise<CensusRegionMapJoinQueryInterface[]> {
        const cacheKey = `censusMap:W${this.instance.world}:Z${this.instance.zone}`;

        // If in cache, grab it
        if (await this.cacheClient.exists(cacheKey)) {
            const data = await this.cacheClient.get(cacheKey);

            if (data) {
                CensusMapRegionQueryParser.logger.verbose(`${cacheKey} HIT`);
                this.metricsHandler.increaseCounter(METRICS_NAMES.CACHE_COUNT, {type: 'map_region', result: 'hit'});
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return JSON.parse(data);
            }
        }

        this.metricsHandler.increaseCounter(METRICS_NAMES.CACHE_COUNT, {type: 'map_region', result: 'miss'});

        CensusMapRegionQueryParser.logger.verbose(`[${this.instance.instanceId}] Grabbing map_region data from Census... (lets hope it doesn't fail...)`);

        try {
            const mapData = this.censusRequestDriver.getMap(this.instance.world, this.instance.zone);
            // Cache the data
            await this.cacheClient.setex(cacheKey, 5, JSON.stringify(mapData));

            return mapData;
        } catch (err) {
            throw new ApplicationException(`[${this.instance.instanceId}] No map data was returned from Census!`);
        }
    }
}
