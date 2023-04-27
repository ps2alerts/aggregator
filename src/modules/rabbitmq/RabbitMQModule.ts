import {Module, OnApplicationBootstrap} from '@nestjs/common';
import {connect} from 'amqp-connection-manager';
import {TYPES} from '../../constants/types';
import ApiMQPublisher from './publishers/ApiMQPublisher';
import ApiMQDelayPublisher from './publishers/ApiMQDelayPublisher';
import RabbitMQQueueFactory from './factories/RabbitMQQueueFactory';
import CensusModule from '../census/CensusModule';
import RedisModule from '../redis/RedisModule';
import EventTimingMiddlewareHandler from '../../middlewares/EventTimingMiddlewareHandler';
import MetricsHandler from '../../handlers/MetricsHandler';
import {ConfigService} from '@nestjs/config';
import MetricsModule from '../metrics/MetricsModule';

@Module({
    imports: [RedisModule, CensusModule, MetricsModule],
    providers: [
        {
            provide: TYPES.rabbitMqConnection,
            useFactory: (config: ConfigService) => connect(config.get('rabbitmq.urls')),
            inject: [ConfigService],
        },
        RabbitMQQueueFactory,
        EventTimingMiddlewareHandler,
        MetricsHandler,

        ApiMQPublisher,
        ApiMQDelayPublisher,
    ],
    exports: [
        TYPES.rabbitMqConnection,
        RabbitMQQueueFactory,
        ApiMQPublisher,
        ApiMQDelayPublisher,
        MetricsHandler,
    ],
})
export default class RabbitMQModule implements OnApplicationBootstrap {
    constructor(
        private readonly apiMqPublisher: ApiMQPublisher,
        private readonly apiMqDelayPublisher: ApiMQDelayPublisher,
    ) {
    }

    public async onApplicationBootstrap() {
        await Promise.all([
            this.apiMqPublisher.connect(),
            this.apiMqDelayPublisher.connect(),
        ]);
    }
}
