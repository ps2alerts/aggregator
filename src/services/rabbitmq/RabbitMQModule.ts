import {Module, OnModuleInit} from '@nestjs/common';
import {connect} from 'amqp-connection-manager';
import {TYPES} from '../../constants/types';
import config from '../../config';
import ApiMQPublisher from './publishers/ApiMQPublisher';
import ApiMQDelayPublisher from './publishers/ApiMQDelayPublisher';
import RabbitMQQueueFactory from './factories/RabbitMQQueueFactory';
import CensusModule from '../census/CensusModule';
import RedisModule from '../redis/RedisModule';
import EventTimingMiddlewareHandler from '../../middlewares/EventTimingMiddlewareHandler';
import StatisticsHandler from '../../handlers/StatisticsHandler';

@Module({
    imports: [RedisModule, CensusModule],
    providers: [
        {
            provide: TYPES.rabbitMqConnection,
            useFactory: () => connect(config.rabbitmq.connectionUrl),
        },

        RabbitMQQueueFactory,
        EventTimingMiddlewareHandler,
        StatisticsHandler,

        ApiMQPublisher,
        ApiMQDelayPublisher,
    ],
    exports: [
        TYPES.rabbitMqConnection,
        RabbitMQQueueFactory,
        ApiMQPublisher,
        ApiMQDelayPublisher,
        StatisticsHandler,
    ],
})
export default class RabbitMQModule implements OnModuleInit {
    constructor(
        private readonly apiMqPublisher: ApiMQPublisher,
        private readonly apiMqDelayPublisher: ApiMQDelayPublisher,
    ) {
    }

    public async onModuleInit() {
        await Promise.all([
            this.apiMqPublisher.connect(),
            this.apiMqDelayPublisher.connect(),
        ]);
    }
}
