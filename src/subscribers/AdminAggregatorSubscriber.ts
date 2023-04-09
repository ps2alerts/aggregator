import {Injectable, OnModuleInit} from '@nestjs/common';
import RabbitMQQueueFactory from '../modules/rabbitmq/factories/RabbitMQQueueFactory';
import AdminAggregatorMessageHandler from '../handlers/AdminAggregatorMessageHandler';
import {AdminQueue} from '../modules/rabbitmq/queues/AdminQueue';
import {ConfigService} from '@nestjs/config';

@Injectable()
export default class AdminAggregatorSubscriber implements OnModuleInit {
    private queue: AdminQueue;

    constructor(
        private readonly queueFactory: RabbitMQQueueFactory,
        private readonly adminMessageHandler: AdminAggregatorMessageHandler,
        private readonly config: ConfigService,
    ) {
    }

    public async onModuleInit(): Promise<void> {
        const queueName = `aggregator-admin-${this.config.get('app.environment')}-${this.config.getOrThrow('census.environment')}`;

        this.queue = this.queueFactory.createAdminQueue(
            queueName,
            this.adminMessageHandler,
        );
        await this.queue.connect();
    }
}
