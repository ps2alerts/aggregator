import {inject, injectable} from 'inversify';
import {TYPES} from '../constants/types';
import {AmqpConnectionManager} from 'amqp-connection-manager';
import {CensusClient, MetagameEvent, PS2Event} from 'ps2census';
import {QueueMessageHandlerInterface} from '../interfaces/QueueMessageHandlerInterface';
import TimingMiddlewareHandler from '../middlewares/TimingMiddlewareHandler';
import AdminQueueMessage from '../data/AdminAggregator/AdminQueueMessage';
import {InstanceEventQueue} from '../services/rabbitmq/queues/InstanceEventQueue';
import {ApiQueue} from '../services/rabbitmq/queues/ApiQueue';
import {AdminQueue} from '../services/rabbitmq/queues/AdminQueue';
import InstanceAbstract from '../instances/InstanceAbstract';
import {MetagameEventQueue} from '../services/rabbitmq/queues/MetagameEventQueue';

@injectable()
export default class RabbitMQQueueFactory {
    constructor(
        @inject(TYPES.rabbitMqConnection) private readonly connectionManager: AmqpConnectionManager,
        private readonly censusClient: CensusClient,
        private readonly timingMiddlewareHandler: TimingMiddlewareHandler,
    ) {}

    public createInstanceQueue(
        queueName: string,
        pattern: string,
        prefetch: number,
        instance: InstanceAbstract,
        handler: QueueMessageHandlerInterface<PS2Event>,
    ): InstanceEventQueue {
        return new InstanceEventQueue(
            this.connectionManager,
            queueName,
            pattern,
            prefetch,
            instance,
            handler,
            this.timingMiddlewareHandler,
            this.censusClient,
        );
    }

    public createApiQueue(
        queueName: string,
        ttl: number,
        deadLetterExchange?: string,
        deadLetterRoutingKey?: string,
    ): ApiQueue {
        return new ApiQueue(
            this.connectionManager,
            queueName,
            ttl,
            deadLetterExchange,
            deadLetterRoutingKey,
        );
    }

    public createAdminQueue(
        queueName: string,
        handler: QueueMessageHandlerInterface<AdminQueueMessage>,
    ): AdminQueue {
        return new AdminQueue(
            this.connectionManager,
            queueName,
            handler,
        );
    }

    public createMetagameEventQueue(
        queueName: string,
        pattern: string,
        handler: QueueMessageHandlerInterface<MetagameEvent>,
    ): MetagameEventQueue {
        return new MetagameEventQueue(
            this.connectionManager,
            queueName,
            pattern,
            handler,
            this.censusClient,
        );
    }
}