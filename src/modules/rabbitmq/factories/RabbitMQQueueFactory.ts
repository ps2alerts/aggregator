import {Inject, Injectable} from '@nestjs/common';
import {TYPES} from '../../../constants/types';
import {AmqpConnectionManager} from 'amqp-connection-manager';
import {CensusClient, MetagameEvent, PS2Event} from 'ps2census';
import {QueueMessageHandlerInterface} from '../../../interfaces/QueueMessageHandlerInterface';
import EventTimingMiddlewareHandler from '../../../middlewares/EventTimingMiddlewareHandler';
import AdminQueueMessage from '../../../data/AdminAggregator/AdminQueueMessage';
import {InstanceEventQueue} from '../queues/InstanceEventQueue';
import {ApiQueue} from '../queues/ApiQueue';
import {AdminQueue} from '../queues/AdminQueue';
import InstanceAbstract from '../../../instances/InstanceAbstract';
import {MetagameEventQueue} from '../queues/MetagameEventQueue';
import {ConfigService} from "@nestjs/config";

@Injectable()
export default class RabbitMQQueueFactory {
    constructor(
        @Inject(TYPES.rabbitMqConnection) private readonly connectionManager: AmqpConnectionManager,
        private readonly censusClient: CensusClient,
        private readonly timingMiddlewareHandler: EventTimingMiddlewareHandler,
        private readonly config: ConfigService,
    ) {}

    public createInstanceQueue(
        queueName: string,
        pattern: string,
        prefetch: number,
        instance: InstanceAbstract,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: QueueMessageHandlerInterface<PS2Event<any>>,
    ): InstanceEventQueue {
        return new InstanceEventQueue(
            this.connectionManager,
            queueName,
            this.config.get('rabbitmq.exchange'),
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
            this.config.get('rabbitmq.exchange'),
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
            this.config.get('rabbitmq.exchange'),
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
            this.config.get('rabbitmq.topicExchange'),
            pattern,
            handler,
            this.censusClient,
        );
    }
}
