import {Logger, Module, OnApplicationBootstrap, OnApplicationShutdown, Inject} from '@nestjs/common';
import {connect, AmqpConnectionManager} from 'amqp-connection-manager';
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
export default class RabbitMQModule implements OnApplicationBootstrap, OnApplicationShutdown {
    private readonly logger = new Logger(RabbitMQModule.name);

    constructor(
        @Inject(TYPES.rabbitMqConnection) private readonly rabbit: AmqpConnectionManager,
        private readonly apiMqPublisher: ApiMQPublisher,
        private readonly apiMqDelayPublisher: ApiMQDelayPublisher,
    ) {
        rabbit
            .on('connect', () => {
                this.logger.log('Connected');
            })
            .on('disconnect', () => {
                this.logger.log('Disconnected');
            })
            .on('connectFailed', () => {
                this.logger.warn('Connection failed');
            });
    }

    public async onApplicationBootstrap() {
        this.logger.debug('Booting RabbitMQModule...');

        await promiseTimeout(this.apiMqPublisher.connect(), 5000, new TimeoutException('MQ Publisher queue did not connect in time!'));
        await promiseTimeout(this.apiMqDelayPublisher.connect(), 5000, new TimeoutException('MQ Publisher Delay queue did not connect in time!'));

        this.logger.debug('RabbitMQModule booted!');
    }

    public async onApplicationShutdown(): Promise<void> {
        await this.rabbit.close();
    }
}
