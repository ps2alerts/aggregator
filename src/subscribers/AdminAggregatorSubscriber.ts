import {Injectable, OnModuleInit} from '@nestjs/common';
import {get} from '../utils/env';
import RabbitMQQueueFactory from '../modules/rabbitmq/factories/RabbitMQQueueFactory';
import AdminAggregatorMessageHandler from '../handlers/AdminAggregatorMessageHandler';
import {AdminQueue} from '../modules/rabbitmq/queues/AdminQueue';

@Injectable()
export default class AdminAggregatorSubscriber implements OnModuleInit {
    private queue: AdminQueue;

    constructor(
        private readonly queueFactory: RabbitMQQueueFactory,
        private readonly adminMessageHandler: AdminAggregatorMessageHandler,
    ) {}

    public async onModuleInit(): Promise<void> {
        const queueName = `aggregator-admin-${get('NODE_ENV', 'development')}-${get('CENSUS_ENVIRONMENT', 'pc')}`;

        this.queue = this.queueFactory.createAdminQueue(
            queueName,
            this.adminMessageHandler,
        );
        await this.queue.connect();
    }
}
