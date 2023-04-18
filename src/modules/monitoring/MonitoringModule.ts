import {Module} from '@nestjs/common';
import {makeCounterProvider, PrometheusModule} from '@willsoto/nestjs-prometheus';
import {MonitoringController} from './MonitoringController';
import {METRICS_NAMES, PROM_METRICS} from './MetricsConstants';

@Module({
    imports: [PrometheusModule.register({
        controller: MonitoringController,
    })],
    providers: [
        makeCounterProvider({
            name: METRICS_NAMES.AGGREGATOR_MESSAGES_COUNT,
            help: 'Aggregator messages received, split by success/fail/retry',
            labelNames: ['environment', 'type'],
        }),
        makeCounterProvider({
            name: METRICS_NAMES.ZONE_MESSAGE_COUNT,
            help: 'Census Event messages split by type',
            labelNames: ['environment', 'type', 'world'],
        }),
    ],
    exports: [
        PROM_METRICS.AGGREGATOR_MESSAGES_COUNT,
        PROM_METRICS.INSTANCES_COUNT,
        PROM_METRICS.ZONE_MESSAGE_COUNT,
    ],
})
export default class MonitoringModule{}
