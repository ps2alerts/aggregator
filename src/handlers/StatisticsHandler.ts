import Redis from 'ioredis';
import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Counter, Gauge} from 'prom-client';
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
    private static readonly logger = new Logger('StatisticsHandler');
    private readonly runId: number;
    private readonly metricsPrefix: string;
    private readonly censusEnvironment: string;

    constructor(
        private readonly cacheClient: Redis,
        config: ConfigService,
        // Counts
        @InjectMetric(METRICS_NAMES.BROKER_COUNT) private readonly brokerCount: Counter<string>,
        @InjectMetric(METRICS_NAMES.CACHE_COUNT) private readonly cacheCount: Counter<string>,
        @InjectMetric(METRICS_NAMES.CENSUS_COUNT) private readonly censusCount: Counter<string>,
        @InjectMetric(METRICS_NAMES.INSTANCES_COUNT) private readonly instancesCount: Counter<string>,
        @InjectMetric(METRICS_NAMES.QUEUE_MESSAGES_COUNT) private readonly queueMessagesCount: Counter<string>,
        @InjectMetric(METRICS_NAMES.ZONE_MESSAGE_COUNT) private readonly zoneMessageCount: Counter<string>,
        // Gauges
        @InjectMetric(METRICS_NAMES.INSTANCES_GAUGE) private readonly instancesGauge: Gauge<string>,

    ) {
        this.runId = config.get('app.runId');
        this.metricsPrefix = `metrics:${this.runId}`;
        this.censusEnvironment = config.getOrThrow('census.environment');
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

        // Inject Census environment into params
        params.environment = this.censusEnvironment;

        switch (metric) {
            case METRICS_NAMES.BROKER_COUNT:
                this.brokerCount.inc(params, count);
                break;
            case METRICS_NAMES.CACHE_COUNT:
                this.cacheCount.inc(params, count);
                break;
            case METRICS_NAMES.CENSUS_COUNT:
                this.censusCount.inc(params, count);
                break;
            case METRICS_NAMES.QUEUE_MESSAGES_COUNT:
                this.queueMessagesCount.inc(params, count);
                break;
            case METRICS_NAMES.INSTANCES_COUNT:
                this.instancesCount.inc(params, count);
                break;
            case METRICS_NAMES.ZONE_MESSAGE_COUNT:
                this.zoneMessageCount.inc(params, count);
                break;
            default:
                StatisticsHandler.logger.error(`Attempted to increase counter for unknown metric: ${metric}`);
                break;
        }
    }

    public setGauge(metric: string, value: number, params?: Partial<Record<string, string | number>>): void {
        if (!params) {
            params = {};
        }

        // Inject Census environment into params
        params.environment = this.censusEnvironment;

        switch (metric) {
            case METRICS_NAMES.INSTANCES_GAUGE:
                this.instancesGauge.set(params, value);
                break;
            default:
                StatisticsHandler.logger.error(`Attempted to set gauge for unknown metric: ${metric}`);
                break;
        }
    }
}
