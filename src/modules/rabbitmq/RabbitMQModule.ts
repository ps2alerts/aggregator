import {Logger, Module, OnApplicationBootstrap} from '@nestjs/common';
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
            useFactory: (config: ConfigService) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const rabbitUrls: string = config.get('rabbitmq.urls');
                console.log(`Connecting to Rabbit: ${rabbitUrls}`);
                const connection = connect(rabbitUrls);
                console.log('Successfully connected to Rabbit!');
                return connection;

            },
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
    private readonly logger = new Logger('Redis');

    constructor(
        private readonly apiMqPublisher: ApiMQPublisher,
        private readonly apiMqDelayPublisher: ApiMQDelayPublisher,
    ) {
    }

    public async onApplicationBootstrap() {
        this.logger.debug('Booting RabbitMQModule...');
        await Promise.all([
            this.apiMqPublisher.connect(),
            this.apiMqDelayPublisher.connect(),
        ]);
        this.logger.debug('RabbitMQModule booted!');
    }
}
