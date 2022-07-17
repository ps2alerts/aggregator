/* eslint-disable @typescript-eslint/no-explicit-any */
// This class is responsible for managing queue state based on instances running

import RabbitMQQueueFactory from '../factories/RabbitMQQueueFactory';
import {getLogger} from '../logger';
import config from '../config';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {PS2EventQueueMessageHandlerInterface} from '../interfaces/PS2EventQueueMessageHandlerInterface';
import {TYPES} from '../constants/types';
import {injectable, multiInject} from 'inversify';
import ZoneMessageHandler from '../handlers/ps2census/ZoneMessageHandler';
import InstanceAbstract from '../instances/InstanceAbstract';
import RabbitMQQueue from '../services/rabbitmq/RabbitMQQueue';

@injectable()
export default class QueueAuthority {
    private static readonly logger = getLogger('QueueAuthority');
    private readonly instanceChannelMap = new Map<InstanceAbstract['instanceId'], RabbitMQQueue[]>();
    private readonly handlerMap = new Map<string, Array<PS2EventQueueMessageHandlerInterface<any>>>();
    private currentInstances: PS2AlertsInstanceInterface[] = [];

    constructor(
        private readonly queueFactory: RabbitMQQueueFactory,
        @multiInject(TYPES.eventInstanceHandlers) eventInstanceHandlers: Array<PS2EventQueueMessageHandlerInterface<any>>,

    ) {
        for (const handler of eventInstanceHandlers) {
            let handlerList = this.handlerMap.get(handler.eventName);

            if (!handlerList) {
                handlerList = [];
                this.handlerMap.set(handler.eventName, handlerList);
            }

            handlerList.push(handler);
        }
    }

    public async startQueuesForInstance(instance: PS2AlertsInstanceInterface): Promise<void> {
        // Check if we're already monitoring the instance, if we are, do nothing
        if (this.instanceChannelMap.has(instance.instanceId)) {
            return;
        }

        const queues: RabbitMQQueue[] = [];
        const dlqName = `aggregator-${instance.instanceId}-deadletter`;

        // Create dead letter queue
        await this.queueFactory.createEventQueue(
            config.rabbitmq.exchange,
            dlqName,
            {
                maxPriority: 10,
                expires: 30 * 60 * 1000,
                messageTtl: 30 * 60 * 1000,
            },
        );

        for (const [eventName, handlers] of this.handlerMap) {
            const queue = await this.queueFactory.createEventQueue(
                config.rabbitmq.topicExchange,
                `aggregator-${instance.instanceId}-${eventName}`,
                {
                    maxPriority: 10,
                    messageTtl: eventName === 'FacilityControl' ? 60000 : 20 * 60 * 1000, // Grace period for the aggregator to process the message. FacilityControl is set to 60s as it's time urgent
                    expires: 15 * 60 * 1000, // Auto deletes the queue after alert finish
                    deadLetterExchange: '',
                    deadLetterRoutingKey: dlqName,
                },
                `${instance.world}.${eventName}.*`,
                new ZoneMessageHandler(instance, handlers),
                eventName === 'GainExperience' ? 100 : 50, // GainExp events are much lighter to process and more numerous
            );

            queues.push(queue);
        }

        this.instanceChannelMap.set(instance.instanceId, queues);

        QueueAuthority.logger.info(`Successfully subscribed queues for instance ${instance.instanceId}!`);
    }

    public syncActiveInstances(instances: PS2AlertsInstanceInterface[]): void {
        this.currentInstances = instances;
    }

    // Disconnect world function
    public async stopQueuesForInstance(instance: PS2AlertsInstanceInterface): Promise<void> {
        // If we have no connection for the world, there's nothing to disconnect from
        if (!this.instanceChannelMap.has(instance.instanceId)) {
            return;
        }

        const queues = this.instanceChannelMap.get(instance.instanceId);

        if (!queues) {
            QueueAuthority.logger.error(`No queues were defined for instance ${instance.instanceId} when there should be some!`);
            return;
        }

        for (const queue of queues) {
            await queue.unbind();
        }
    }

    // Asks instance authority for all alerts available and ensures the queues are subscribed
    public async subscribeToActives(): Promise<void> {
        for (const instance of this.currentInstances) {
            await this.startQueuesForInstance(instance);
        }

        QueueAuthority.logger.info('All queues started for active alerts');
    }
}
