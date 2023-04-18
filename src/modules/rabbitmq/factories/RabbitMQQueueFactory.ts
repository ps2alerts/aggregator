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
import {ConfigService} from '@nestjs/config';
import StatisticsHandler from '../../../handlers/StatisticsHandler';

@Injectable()
export default class RabbitMQQueueFactory {
    constructor(
        @Inject(TYPES.rabbitMqConnection) private readonly connectionManager: AmqpConnectionManager,
        private readonly censusClient: CensusClient,
        private readonly timingMiddlewareHandler: EventTimingMiddlewareHandler,
        private readonly config: ConfigService,
        private readonly statisticsHandler: StatisticsHandler,
    ) {}

    // Creates the queues that are used to process Death, VehicleDestroy etc.
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
            this.statisticsHandler,
            this.config.get('rabbitmq.topicExchange'),
            pattern,
            prefetch,
            instance,
            handler,
            this.timingMiddlewareHandler,
            this.censusClient,
        );
    }

    // Creates queue to send data to the API for processing
    public createApiQueue(
        queueName: string,
        ttl: number,
        deadLetterExchange?: string,
        deadLetterRoutingKey?: string,
    ): ApiQueue {
        return new ApiQueue(
            this.connectionManager,
            queueName,
            this.statisticsHandler,
            this.config.get('rabbitmq.exchange'),
            ttl,
            deadLetterExchange,
            deadLetterRoutingKey,
        );
    }

    // Creates queue to control the aggregator via admin commands
    public createAdminQueue(
        queueName: string,
        handler: QueueMessageHandlerInterface<AdminQueueMessage>,
    ): AdminQueue {
        return new AdminQueue(
            this.connectionManager,
            queueName,
            this.statisticsHandler,
            this.config.get('rabbitmq.exchange'),
            handler,
        );
    }

    // Creates queues to process MetagameEvent messages
    public createMetagameEventQueue(
        queueName: string,
        pattern: string,
        handler: QueueMessageHandlerInterface<MetagameEvent>,
    ): MetagameEventQueue {
        return new MetagameEventQueue(
            this.connectionManager,
            queueName,
            this.statisticsHandler,
            this.config.get('rabbitmq.topicExchange'),
            pattern,
            handler,
            this.censusClient,
        );
    }
}
