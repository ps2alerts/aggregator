import {Module} from '@nestjs/common';
import {
    makeCounterProvider,
    makeGaugeProvider,
    makeHistogramProvider,
    PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import {MetricsController} from './MetricsController';
import {METRICS_NAMES, PROM_METRICS} from './MetricsConstants';

@Module({
    imports: [PrometheusModule.register({
        controller: MetricsController,
    })],
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
            labelNames: ['environment', 'type'],
        }),
        makeCounterProvider({
            name: METRICS_NAMES.ZONE_MESSAGE_COUNT,
            help: 'Census Event messages split by type',
            labelNames: ['environment', 'type', 'world', 'zone'],
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
            help: 'External endpoints roundtimes',
            labelNames: ['environment', 'provider', 'endpoint'],
            buckets: [0.01, 0.05, 0.10, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30], // in seconds
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
    ],
})
export default class MetricsModule {}
