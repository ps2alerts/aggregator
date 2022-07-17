import {injectable} from 'inversify';
import {RabbitMQQueueWrapperInterface} from '../../../interfaces/RabbitMQQueueWrapperInterface';
import {get} from '../../../utils/env';
import RabbitMQQueueFactory from '../../../factories/RabbitMQQueueFactory';
import config from '../../../config';
import AdminAggregatorMessageHandler from '../../../handlers/AdminAggregatorMessageHandler';
import RabbitMQQueue from '../RabbitMQQueue';

@injectable()
export default class AdminAggregatorSubscriber implements RabbitMQQueueWrapperInterface {
    private queue: RabbitMQQueue;

    constructor(
        private readonly queueFactory: RabbitMQQueueFactory,
        private readonly adminMessageHandler: AdminAggregatorMessageHandler,
    ) {}

    public async connect(): Promise<void> {
        const queueName = `aggregator-admin-${get('NODE_ENV', 'development')}-${get('CENSUS_ENVIRONMENT', 'pc')}`;

        this.queue = await this.queueFactory.createAdminQueue(
            config.rabbitmq.exchange,
            queueName,
            this.adminMessageHandler,
        );
    }
}
