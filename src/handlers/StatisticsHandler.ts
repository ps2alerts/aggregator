import Redis from 'ioredis';
import config from '../config';
import {Injectable} from '@nestjs/common';

export enum MetricTypes {
    CENSUS_CACHE_HIT = 'Census:CacheHit',
    CENSUS_CACHE_MISS = 'Census:CacheMiss',
    CENSUS_CHARACTER = 'Census:Character',
    CENSUS_FACILITY_DATA = 'Census:FacilityData',
    CENSUS_ITEM = 'Census:Item',
    CENSUS_MAP_REGION = 'Census:MapRegion',
    EVENT_DEATH = 'Event:Death',
    EVENT_FACILITY_CONTROL = 'Event:FacilityControl',
    EVENT_GAIN_EXPERIENCE = 'Event:GainExperience',
    EVENT_VEHICLE_DESTROY = 'Event:VehicleDestroy',
    PS2ALERTS_API = 'PS2Alerts:API',
}

const censusEndpoints = [
    MetricTypes.CENSUS_CHARACTER,
    MetricTypes.CENSUS_FACILITY_DATA,
    MetricTypes.CENSUS_ITEM,
    MetricTypes.CENSUS_MAP_REGION,
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
            await this.cacheClient.lpush(censusCacheKey, duration);
            return;
        }

        await this.cacheClient.lpush(listKey, duration);
    }
}
