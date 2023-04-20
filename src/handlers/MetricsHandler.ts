import Redis from 'ioredis';
import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Counter, Gauge, Histogram} from 'prom-client';
import {InjectMetric} from '@willsoto/nestjs-prometheus';
import {METRICS_NAMES} from '../modules/metrics/MetricsConstants';

@Injectable()
export default class MetricsHandler {
    private static readonly logger = new Logger('metricsHandler');
    private readonly runId: number;
    private readonly metricsPrefix: string;
    private readonly censusEnvironment: string;

    constructor(
        private readonly cacheClient: Redis,
        config: ConfigService,
        // Counts
        @InjectMetric(METRICS_NAMES.BROKER_COUNT) private readonly brokerCount: Counter<string>,
        @InjectMetric(METRICS_NAMES.CACHE_COUNT) private readonly cacheCount: Counter<string>,
        @InjectMetric(METRICS_NAMES.EXTERNAL_REQUESTS_COUNT) private readonly censusCount: Counter<string>,
        @InjectMetric(METRICS_NAMES.INSTANCES_COUNT) private readonly instancesCount: Counter<string>,
        @InjectMetric(METRICS_NAMES.QUEUE_MESSAGES_COUNT) private readonly queueMessagesCount: Counter<string>,
        @InjectMetric(METRICS_NAMES.ZONE_MESSAGE_COUNT) private readonly zoneMessageCount: Counter<string>,
        // Gauges
        @InjectMetric(METRICS_NAMES.CACHE_GAUGE) private readonly cacheGauge: Gauge<string>,
        @InjectMetric(METRICS_NAMES.INSTANCES_GAUGE) private readonly instancesGauge: Gauge<string>,

        // Histograms
        @InjectMetric(METRICS_NAMES.EVENT_PROCESSING_HISTOGRAM) private readonly eventProcessingHistogram: Histogram<string>,
        @InjectMetric(METRICS_NAMES.EXTERNAL_REQUESTS_HISTOGRAM) private readonly externalRequestsHistogram: Histogram<string>,
    ) {
        this.runId = config.get('app.runId');
        this.metricsPrefix = `metrics:${this.runId}`;
        this.censusEnvironment = config.getOrThrow('census.environment');
    }

    // Provides a singular entrypoint for easier refactoring, saves having to inject counters everywhere
    public increaseCounter(metric: string, params?: Partial<Record<string, string | number>>, count?: number): void {
        params = this.configureParams(params);

        switch (metric) {
            case METRICS_NAMES.BROKER_COUNT:
                this.brokerCount.inc(params, count);
                break;
            case METRICS_NAMES.CACHE_COUNT:
                this.cacheCount.inc(params, count);
                break;
            case METRICS_NAMES.EXTERNAL_REQUESTS_COUNT:
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
                MetricsHandler.logger.error(`Attempted to increase counter for unknown metric: ${metric}`);
                break;
        }
    }

    public setGauge(metric: string, value: number, params?: Partial<Record<string, string | number>>): void {
        params = this.configureParams(params);

        switch (metric) {
            case METRICS_NAMES.CACHE_GAUGE:
                this.cacheGauge.set(params, value);
                break;
            case METRICS_NAMES.INSTANCES_GAUGE:
                this.instancesGauge.set(params, value);
                break;
            default:
                MetricsHandler.logger.error(`Attempted to set gauge for unknown metric: ${metric}`);
                break;
        }
    }

    public getHistogram(metric: string, params?: Partial<Record<string, string | number>>) {
        params = this.configureParams(params);

        switch (metric) {
            case METRICS_NAMES.EVENT_PROCESSING_HISTOGRAM:
                return this.eventProcessingHistogram.startTimer(params);
            case METRICS_NAMES.EXTERNAL_REQUESTS_HISTOGRAM:
                return this.externalRequestsHistogram.startTimer(params);
            default:
                MetricsHandler.logger.error(`Attempted to start timer for unknown metric: ${metric}`);
                break;
        }
    }

    private configureParams(params?: Partial<Record<string, string | number>>) {
        if (!params) {
            params = {};
        }

        // Inject Census environment into params
        params.environment = this.censusEnvironment;
        return params;
    }
}
