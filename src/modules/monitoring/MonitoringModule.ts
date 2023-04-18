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
            labelNames: ['status'],
        }),
    ],
    exports: [
        PROM_METRICS.AGGREGATOR_MESSAGES,
    ],
})
export default class MonitoringModule{}
