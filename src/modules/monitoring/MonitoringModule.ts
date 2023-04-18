import {Module} from '@nestjs/common';
import {makeCounterProvider, PrometheusModule} from '@willsoto/nestjs-prometheus';
import {MonitoringController} from './MonitoringController';
import {METRICS} from './MetricsConstants';

@Module({
    imports: [PrometheusModule.register({
        controller: MonitoringController,
    })],
    providers: [
        makeCounterProvider({
            name: 'aggregator_messages_successful',
            help: 'metric_help',
        }),
    ],
    exports: [
        METRICS.AGGREGATOR_MESSAGES_SUCCESSFUL,
    ],
})
export default class MonitoringModule{}
