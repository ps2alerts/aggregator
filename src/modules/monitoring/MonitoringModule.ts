import {Module, OnModuleInit} from '@nestjs/common';
import {makeCounterProvider, PrometheusModule} from '@willsoto/nestjs-prometheus';
import {MonitoringController} from './MonitoringController';

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
})
export default class MonitoringModule implements OnModuleInit {
    public async onModuleInit() {
        // Initalize all counters and gauges

    }
}
