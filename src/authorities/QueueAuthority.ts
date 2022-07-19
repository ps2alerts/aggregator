/* eslint-disable @typescript-eslint/no-explicit-any */
// This class is responsible for managing queue state based on instances running

import RabbitMQQueueFactory from '../factories/RabbitMQQueueFactory';
import {getLogger} from '../logger';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {PS2EventQueueMessageHandlerInterface} from '../interfaces/PS2EventQueueMessageHandlerInterface';
import {TYPES} from '../constants/types';
import {injectable, multiInject} from 'inversify';
import ZoneMessageHandler from '../handlers/ps2census/ZoneMessageHandler';
import InstanceAbstract from '../instances/InstanceAbstract';
import {PS2AlertsQueueInterface} from '../interfaces/PS2AlertsQueueInterface';

@injectable()
export default class QueueAuthority {
    private static readonly logger = getLogger('QueueAuthority');
    private readonly instanceChannelMap = new Map<InstanceAbstract['instanceId'], PS2AlertsQueueInterface[]>();
    private readonly handlerMap = new Map<string, Array<PS2EventQueueMessageHandlerInterface<any>>>();
    private readonly queuesMarkedForDeletionMap = new Map<number, PS2AlertsQueueInterface[]>();
    private currentInstances: PS2AlertsInstanceInterface[] = [];
    private timer?: NodeJS.Timeout;

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

    public run(): void {
        if (this.timer) {
            QueueAuthority.logger.warn('Attempted to run QueueAuthority timer when already defined!');
            this.stop();
        }

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.timer = setInterval(async () => {
            await this.checkQueueDeadlines();
        }, 15000);

        QueueAuthority.logger.debug('Created QueueAuthority timer');
    }

    public stop(): void {
        QueueAuthority.logger.debug('Clearing QueueAuthority timer');

        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    public async startQueuesForInstance(instance: PS2AlertsInstanceInterface): Promise<void> {
        // Check if we're already monitoring the instance, if we are, do nothing
        if (this.instanceChannelMap.has(instance.instanceId)) {
            return;
        }

        const queues: PS2AlertsQueueInterface[] = [];
        // const delayQueueName = `aggregator-${instance.instanceId}-delay`;
        //
        // const delayQueue = this.queueFactory.createInstanceQueue(
        //     `aggregator-${instance.instanceId}-${eventName}`,
        //     `${instance.world}.${eventName}.*`,
        //     eventName === 'GainExperience' ? 100 : 50, // GainExp events are much lighter to process and more numerous
        //     instance,
        //     new ZoneMessageHandler(instance, handlers),
        // );

        // Create a queue that holds delayed messages. These messages have custom TTLs on them, which makes a DLQ inappropriate.

        // queues.push(delayQueue);

        for (const [eventName, handlers] of this.handlerMap) {
            const queue = this.queueFactory.createInstanceQueue(
                `aggregator-${instance.instanceId}-${eventName}`,
                `${instance.world}.${eventName}.*`,
                eventName === 'GainExperience' ? 100 : 50, // GainExp events are much lighter to process and more numerous
                instance,
                new ZoneMessageHandler(instance, handlers),
            );

            await queue.connect();

            queues.push(queue);
        }

        this.instanceChannelMap.set(instance.instanceId, queues);

        QueueAuthority.logger.info(`Successfully subscribed queues for instance ${instance.instanceId}!`);
    }

    public syncActiveInstances(instances: PS2AlertsInstanceInterface[]): void {
        this.currentInstances = instances;
    }

    // Disconnect world function
    public stopQueuesForInstance(instance: PS2AlertsInstanceInterface): void {
        // If we have no connection for the world, there's nothing to disconnect from
        if (!this.instanceChannelMap.has(instance.instanceId)) {
            return;
        }

        const queues = this.instanceChannelMap.get(instance.instanceId);

        if (!queues) {
            QueueAuthority.logger.error(`No queues were defined for instance ${instance.instanceId} when there should be some!`);
            return;
        }

        // Mark the queues for deletion with a grace period (@see checkQueueDeadlines)
        const deadline = new Date().getTime() + (2 * 60 * 1000); // Messages have at least 2 minutes to reconcile
        this.queuesMarkedForDeletionMap.set(deadline, queues);
        QueueAuthority.logger.debug(`Flagged ${instance.instanceId}'s queues for deletion`);

        // Remove the queues from the instanceChannelMap as we're effectively done with them
        this.instanceChannelMap.delete(instance.instanceId);
    }

    // Asks instance authority for all alerts available and ensures the queues are subscribed
    public async subscribeToActives(): Promise<void> {
        for (const instance of this.currentInstances) {
            await this.startQueuesForInstance(instance);
        }

        QueueAuthority.logger.info('All queues started for active alerts');
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    private async checkQueueDeadlines(): Promise<void> {
        QueueAuthority.logger.silly('Running QueueAuthority deadline check');
        const now = new Date().getTime();

        // Check the deadlines for each queue and if it's over, destroy them.
        this.queuesMarkedForDeletionMap.forEach((queues, deadline) => {
            if (now > deadline) {
                queues.forEach((queue) => {
                    void queue.destroy();
                });
                this.queuesMarkedForDeletionMap.delete(deadline);
            }
        });
    }
}
