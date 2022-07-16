/* eslint-disable @typescript-eslint/no-explicit-any */
// This class is responsible for managing queue state based on instances running

import RabbitMQQueueFactory from '../factories/RabbitMQQueueFactory';
import {getLogger} from '../logger';
import config from '../config';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {PS2EventInstanceHandlerContract} from '../interfaces/PS2EventInstanceHandlerContract';
import {TYPES} from '../constants/types';
import {injectable, multiInject} from 'inversify';
import ZoneMessageHandler from '../handlers/ps2census/ZoneMessageHandler';
import InstanceAbstract from '../instances/InstanceAbstract';
import RabbitMQQueue from '../services/rabbitmq/RabbitMQQueue';

@injectable()
export default class QueueAuthority {
    private static readonly logger = getLogger('QueueAuthority');
    private readonly instanceChannelMap = new Map<InstanceAbstract['instanceId'], RabbitMQQueue[]>();
    private readonly handlerMap = new Map<string, Array<PS2EventInstanceHandlerContract<any>>>();
    private currentInstances: PS2AlertsInstanceInterface[] = [];
    private readonly emptyQueueTimer?: NodeJS.Timeout;

    constructor(
        private readonly queueFactory: RabbitMQQueueFactory,
        @multiInject(TYPES.eventInstanceHandlers) eventInstanceHandlers: Array<PS2EventInstanceHandlerContract<any>>,
    ) {
        for (const handler of eventInstanceHandlers) {
            let handlerList = this.handlerMap.get(handler.eventName);

            if (!handlerList) {
                handlerList = [];
                this.handlerMap.set(handler.eventName, handlerList);
            }

            handlerList.push(handler);
        }

        if (this.emptyQueueTimer) {
            QueueAuthority.logger.warn('Attempted to start empty queue timer when already defined!');
        } else {
            this.emptyQueueTimer = setInterval(() => {
                QueueAuthority.logger.debug('Running empty queue timer');

                this.checkForEmptyQueues();
            }, 60000);
        }
    }

    public async startQueuesForInstance(instance: PS2AlertsInstanceInterface): Promise<void> {
        // Check if we're already monitoring the instance, if we are, do nothing
        if (this.instanceChannelMap.has(instance.instanceId)) {
            return;
        }

        const queues: RabbitMQQueue[] = [];

        for (const [eventName, handlers] of this.handlerMap) {
            const queue = await this.queueFactory.create(
                config.rabbitmq.topicExchange,
                `aggregator-${instance.instanceId}-${eventName}`,
                {
                    maxPriority: 10,
                    messageTtl: 15 * 60 * 1000,
                },
                `${instance.world}.${eventName}.*`,
                new ZoneMessageHandler(instance, handlers),
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

    // The purpose of this method is to scan each queue and check if they're all empty, if they are then delete the queues and the instance entry.
    // All queues have a TTL of 5 minutes, so this will mean eventually the messages will be deleted, and thus after 5 minutes of the alert ending, the queues too.
    private checkForEmptyQueues(): void {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.instanceChannelMap.forEach(async (queues, instance) => {
            QueueAuthority.logger.debug(`Checking ${instance} for empty queues...`);

            // If there's an active instance, we never want to destroy the queue.
            let instanceFound = false;
            this.currentInstances.map((activeInstance) => {
                if (activeInstance.instanceId === instance) {
                    instanceFound = true;
                }
            });

            if (instanceFound) {
                QueueAuthority.logger.debug(`Instance ${instance} found for the queue, not destroying`);
                return;
            }

            let markToDestroy = true;

            queues.forEach((queue) => {
                if (!queue.queueEmpty()) {
                    markToDestroy = false;
                }
            });

            if (markToDestroy) {
                for (const queue of queues) {
                    await queue.destroy();
                }

                this.instanceChannelMap.delete(instance);

            }
        });
    }
}
