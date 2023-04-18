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
            name: METRICS_NAMES.AGGREGATOR_MESSAGES,
            help: 'Aggregator messages received, split by success/fail/retry',
            labelNames: ['environment', 'type'],
        }),
        makeCounterProvider({
            name: METRICS_NAMES.EVENT_TYPES,
            help: 'Census Event messages split by type',
            labelNames: ['environment', 'type', 'world'],
        }),
    ],
    exports: [
        PROM_METRICS.AGGREGATOR_MESSAGES,
        PROM_METRICS.EVENT_TYPES,
    ],
})
export default class MonitoringModule{}
