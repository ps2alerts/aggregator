import Redis from 'ioredis';
import config from '../config';
import {Injectable} from '@nestjs/common';

export enum MetricTypes {
    CENSUS_CHARACTER = 'CensusCharacter',
    CENSUS_FACILITY_DATA = 'CensusFacilityData',
    CENSUS_MAP_REGION = 'CensusMapRegion',
    CENSUS_ITEM = 'CensusItem',
    CENSUS_CACHE_HIT = 'CensusCacheHit',
    CENSUS_CACHE_MISS = 'CensusCacheMiss',
    EVENT_DEATH = 'Death',
    EVENT_FACILITY_CONTROL = 'FacilityControl',
    EVENT_GAIN_EXPERIENCE = 'GainExperience',
    EVENT_VEHICLE_DESTROY = 'VehicleDestroy',
    PS2A_API = 'PS2AlertsAPI',
}

const censusEndpoints = [
    MetricTypes.CENSUS_CHARACTER,
    MetricTypes.CENSUS_FACILITY_DATA,
    MetricTypes.CENSUS_MAP_REGION,
    MetricTypes.CENSUS_ITEM,
];

@Injectable()
export default class StatisticsHandler {
    private readonly runId = config.app.runId;
    private readonly metricsPrefix = `metrics:${this.runId}`;

    constructor(private readonly cacheClient: Redis) {}

    public async logTime(started: Date, type: MetricTypes | string): Promise<void> {
        const finishedTime = new Date().getTime();
        const listKey = `${this.metricsPrefix}:${type}`;

        const duration = finishedTime - started.getTime();

        // If finished time is less than <50ms, we're assuming this got pulled from Redis, and we won't count this. Census is not this quick!
        if (censusEndpoints.includes(<MetricTypes>type)) {
            const hit = duration <= 50;
            const censusCacheKey = `${this.metricsPrefix}:${hit ? MetricTypes.CENSUS_CACHE_HIT : MetricTypes.CENSUS_CACHE_MISS}`;
            await this.cacheClient.lpush(censusCacheKey, hit ? 1 : 0);
            return;
        }

        await this.cacheClient.lpush(listKey, duration);
    }
}
