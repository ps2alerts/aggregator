import {injectable} from 'inversify';
import {RabbitMQQueueWrapperInterface} from '../../../interfaces/RabbitMQQueueWrapperInterface';
import {get} from '../../../utils/env';
import RabbitMQQueueFactory from '../../../factories/RabbitMQQueueFactory';
import AdminAggregatorMessageHandler from '../../../handlers/AdminAggregatorMessageHandler';
import {AdminQueue} from '../queues/AdminQueue';

@injectable()
export default class AdminAggregatorSubscriber implements RabbitMQQueueWrapperInterface {
    private queue: AdminQueue;

    constructor(
        private readonly queueFactory: RabbitMQQueueFactory,
        private readonly adminMessageHandler: AdminAggregatorMessageHandler,
    ) {}

    public async connect(): Promise<void> {
        const queueName = `aggregator-admin-${get('NODE_ENV', 'development')}-${get('CENSUS_ENVIRONMENT', 'pc')}`;

        this.queue = this.queueFactory.createAdminQueue(
            queueName,
            this.adminMessageHandler,
        );
        await this.queue.connect();
    }
}
