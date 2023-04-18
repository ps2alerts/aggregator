import Redis from 'ioredis';
import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Counter} from 'prom-client';
import {InjectMetric} from '@willsoto/nestjs-prometheus';
import {METRICS_NAMES} from '../modules/monitoring/MetricsConstants';

export enum MetricTypes {
    CACHE_CHARACTER_HITS = 'Cache:Character:Hits',
    CACHE_CHARACTER_MISSES = 'Cache:Character:Misses',
    CACHE_ITEM_HITS = 'Cache:Item:Hits',
    CACHE_ITEM_MISSES = 'Cache:Item:Misses',
    CACHE_MAP_REGION_HITS = 'Cache:MapRegion:Hits',
    CENSUS_CHARACTER = 'Census:Character',
    CENSUS_ITEM = 'Census:Item',
    CENSUS_MAP_REGION = 'Census:MapRegion',
    EVENT_DEATH = 'Event:Death', // See: EventTimingMiddlewareHandler
    EVENT_FACILITY_CONTROL = 'Event:FacilityControl', // See: EventTimingMiddlewareHandler
    EVENT_GAIN_EXPERIENCE = 'Event:GainExperience', // See: EventTimingMiddlewareHandler
    EVENT_VEHICLE_DESTROY = 'Event:VehicleDestroy', // See: EventTimingMiddlewareHandler
    FALCON_ITEM = 'Falcon:Item',
    PS2ALERTS_API = 'PS2Alerts:API',
    PS2ALERTS_API_INSTANCE = 'PS2Alerts:API:Instance',
    PS2ALERTS_API_INSTANCE_FACILITY = 'PS2Alerts:API:InstanceFacility',
    PS2ALERTS_API_CENSUS_REGIONS = 'PS2Alerts:API:CensusRegions',
    RABBITMQ_SUCCESS= 'RabbitMQ:Success',
    RABBITMQ_RETRY = 'RabbitMQ:Retry',
}

@Injectable()
export default class StatisticsHandler {
    private readonly runId: number;
    private readonly metricsPrefix: string;

    constructor(
        private readonly cacheClient: Redis,
        private readonly config: ConfigService,
        @InjectMetric(METRICS_NAMES.AGGREGATOR_MESSAGES) private readonly aggregatorMessagesCount: Counter<string>,
        @InjectMetric(METRICS_NAMES.EVENT_TYPES) private readonly eventTypesCount: Counter<string>,
    ) {
        this.runId = config.get('app.runId');
        this.metricsPrefix = `metrics:${this.runId}`;
    }

    public async logMetric(started: Date, type: MetricTypes | string, success?: boolean | null, retry?: boolean): Promise<void> {
        // TODO: Replace with prometheus histogram
        const listKey = `${this.metricsPrefix}:${type}`;

        const finishedTime = new Date().getTime();
        const duration = finishedTime - started.getTime();

        const successString = success === null ? 'N/A' : success ? '1' : '0';
        const retryString = retry === null ? 'N/A' : retry ? '1' : '0';
        const statsString = `${duration},${successString},${retryString}`;

        await this.cacheClient.lpush(listKey, statsString);
    }

    // Provides a singular entrypoint for easier refactoring, saves having to inject counters everywhere
    public increaseCounter(metric: string, params?: Partial<Record<string, string | number>>, count?: number): void {
        if (!params) {
            params = {};
        }

        // Inject environment into params
        params.environment = this.config.get('census.environment');

        switch (metric) {
            case METRICS_NAMES.AGGREGATOR_MESSAGES:
                this.aggregatorMessagesCount.inc(params, count);
                break;
            case METRICS_NAMES.EVENT_TYPES:
                this.eventTypesCount.inc(params, count);
                break;
        }
    }
}
