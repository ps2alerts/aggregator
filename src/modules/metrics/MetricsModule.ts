import {Module} from '@nestjs/common';
import {
    makeCounterProvider,
    makeGaugeProvider,
    makeHistogramProvider,
    PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import {METRICS_NAMES, PROM_METRICS} from './MetricsConstants';

@Module({
    imports: [PrometheusModule.register()],
    providers: [
        // Counts
        makeCounterProvider({
            name: METRICS_NAMES.BROKER_COUNT,
            help: 'Broker statistics',
            labelNames: ['environment', 'broker', 'type', 'result'],
        }),
        makeCounterProvider({
            name: METRICS_NAMES.CACHE_COUNT,
            help: 'Cache layer statistics',
            labelNames: ['environment', 'type', 'result'],
        }),
        makeCounterProvider({
            name: METRICS_NAMES.ERRORS_COUNT,
            help: 'Errors to be monitored',
            labelNames: ['environment', 'type', 'result', 'origin'],
        }),
        makeCounterProvider({
            name: METRICS_NAMES.EXTERNAL_REQUESTS_COUNT,
            help: 'External endpoints statistics',
            labelNames: ['environment', 'provider', 'endpoint', 'result'],
        }),
        makeCounterProvider({
            name: METRICS_NAMES.INSTANCES_COUNT,
            help: 'Instance metrics',
            labelNames: ['environment', 'type', 'world', 'zone'],
        }),
        makeCounterProvider({
            name: METRICS_NAMES.QUEUE_MESSAGES_COUNT,
            help: 'Aggregator messages received, split by success/fail/retry',
            labelNames: ['environment', 'type', 'event_type'],
        }),
        makeCounterProvider({
            name: METRICS_NAMES.ZONE_MESSAGE_COUNT,
            help: 'Census Event messages split by type',
            labelNames: ['environment', 'type', 'result', 'world', 'zone'],
        }),
        // Gauges
        makeGaugeProvider({
            name: METRICS_NAMES.CACHE_GAUGE,
            help: 'Cache metrics including number of keys',
            labelNames: ['environment', 'type'],
        }),
        makeGaugeProvider({
            name: METRICS_NAMES.INSTANCES_GAUGE,
            help: 'Number of active instances',
            labelNames: ['environment', 'type'],
        }),
        // Histograms
        makeHistogramProvider({
            name: METRICS_NAMES.EXTERNAL_REQUESTS_HISTOGRAM,
            help: 'External endpoints response timings',
            labelNames: ['environment', 'provider', 'endpoint'],
            buckets: [0.01, 0.02, 0.03, 0.04, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.3, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40], // in seconds
        }),
        makeHistogramProvider({
            name: METRICS_NAMES.EVENT_PROCESSING_HISTOGRAM,
            help: 'Message processing timings',
            labelNames: ['environment', 'eventType'],
            buckets: [0.001, 0.002, 0.003, 0.004, 0.005, 0.006, 0.007, 0.008, 0.009, 0.01, 0.05, 0.1, 0.5, 1, 2, 3, 4, 5, 10, 20, 30], // in seconds
        }),
    ],
    exports: [
        // Counts
        PROM_METRICS.BROKER_COUNT,
        PROM_METRICS.CACHE_COUNT,
        PROM_METRICS.EXTERNAL_REQUESTS_COUNT,
        PROM_METRICS.QUEUE_MESSAGES_COUNT,
        PROM_METRICS.INSTANCES_COUNT,
        PROM_METRICS.ZONE_MESSAGE_COUNT,
        // Gauges
        PROM_METRICS.CACHE_GAUGE,
        PROM_METRICS.INSTANCES_GAUGE,
        // Histograms
        PROM_METRICS.EXTERNAL_REQUESTS_HISTOGRAM,
        PROM_METRICS.EVENT_PROCESSING_HISTOGRAM,
    ],
})
export default class MetricsModule {}
