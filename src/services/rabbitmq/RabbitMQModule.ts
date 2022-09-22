import {Module, OnModuleInit} from '@nestjs/common';
import {connect} from 'amqp-connection-manager';
import {TYPES} from '../../constants/types';
import config from '../../config';
import ApiMQPublisher from './publishers/ApiMQPublisher';
import ApiMQDelayPublisher from './publishers/ApiMQDelayPublisher';
import RabbitMQQueueFactory from './factories/RabbitMQQueueFactory';
import CensusModule from '../census/CensusModule';
import TimingMiddlewareHandler from './middlewares/TimingMiddlewareHandler';
import RedisModule from '../redis/RedisModule';

@Module({
    imports: [RedisModule, CensusModule],
    providers: [
        {
            provide: TYPES.rabbitMqConnection,
            useFactory: () => connect(config.rabbitmq.connectionUrl),
        },

        RabbitMQQueueFactory,
        TimingMiddlewareHandler,

        ApiMQPublisher,
        ApiMQDelayPublisher,
    ],
    exports: [
        TYPES.rabbitMqConnection,
        RabbitMQQueueFactory,
        TimingMiddlewareHandler,
        ApiMQPublisher,
        ApiMQDelayPublisher,
    ],
})
export default class RabbitMQModule implements OnModuleInit {
    constructor(
        private readonly apiMqPublisher: ApiMQPublisher,
        private readonly apiMqDelayPublisher: ApiMQDelayPublisher,
    ) {
    }

    async onModuleInit() {
        await Promise.all([
            this.apiMqPublisher.connect(),
            this.apiMqDelayPublisher.connect(),
        ]);
    }
}
