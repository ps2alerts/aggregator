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
import {promiseTimeout} from '../../utils/PromiseTimeout';
import TimeoutException from '../../exceptions/TimeoutException';

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

        await promiseTimeout(this.apiMqPublisher.connect(), 5000, new TimeoutException('MQ Publisher queue did not connect in time!'));
        await promiseTimeout(this.apiMqDelayPublisher.connect(), 5000, new TimeoutException('MQ Publisher Delay queue did not connect in time!'));

        this.logger.debug('RabbitMQModule booted!');
    }
}
