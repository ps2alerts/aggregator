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
                `aggregator-${instance.world}-${eventName}`,
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

        QueueAuthority.logger.info(`Successfully subscribed queues to world ${instance.world}!`);
    }

    // Disconnect world function
}
