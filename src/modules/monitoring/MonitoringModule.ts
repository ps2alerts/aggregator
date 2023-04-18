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
            name: METRICS_NAMES.AGGREGATOR_MESSAGES_SUCCESS,
            help: 'Number of messages successfully processed',
        }),
        makeCounterProvider({
            name: METRICS_NAMES.AGGREGATOR_MESSAGES_RETRY,
            help: 'Number of messages which were retried',
        }),
        makeCounterProvider({
            name: METRICS_NAMES.AGGREGATOR_MESSAGES_FAIL,
            help: 'Number of messages which failed processing',
        }),
    ],
    exports: [
        PROM_METRICS.AGGREGATOR_MESSAGES_SUCCESS,
        PROM_METRICS.AGGREGATOR_MESSAGES_RETRY,
        PROM_METRICS.AGGREGATOR_MESSAGES_FAIL,
    ],
})
export default class MonitoringModule{}
