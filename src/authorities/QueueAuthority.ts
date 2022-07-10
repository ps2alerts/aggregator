/* eslint-disable @typescript-eslint/no-explicit-any */
// This class is responsible for managing queue state based on instances running

import RabbitMQChannelFactory from '../factories/RabbitMQChannelFactory';
import {getLogger} from '../logger';
import config from '../config';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {PS2EventInstanceHandlerContract} from '../interfaces/PS2EventInstanceHandlerContract';
import {TYPES} from '../constants/types';
import {injectable, multiInject} from 'inversify';
import ZoneMessageHandler from '../handlers/ps2census/ZoneMessageHandler';
import {ChannelWrapper} from 'amqp-connection-manager';
import InstanceAbstract from '../instances/InstanceAbstract';

@injectable()
export default class QueueAuthority {
    private static readonly logger = getLogger('QueueAuthority');
    private readonly instanceChannelMap = new Map<InstanceAbstract['instanceId'], ChannelWrapper[]>();
    private readonly handlerMap = new Map<string, Array<PS2EventInstanceHandlerContract<any>>>();

    constructor(
        private readonly channelFactory: RabbitMQChannelFactory,
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

    public startQueuesForInstance(instance: PS2AlertsInstanceInterface): void {
        // Check if we're already monitoring the instance, if we are, do nothing
        if (this.instanceChannelMap.has(instance.instanceId)) {
            return;
        }

        const channels: ChannelWrapper[] = [];

        for (const [eventName, handlers] of this.handlerMap) {
            const channel = this.channelFactory.create(
                config.rabbitmq.topicExchange,
                `${instance.world}-${eventName}`,
                {
                    maxPriority: 10,
                    messageTtl: 15 * 60 * 1000,
                },
                `${instance.world}.${eventName}.*`,
                new ZoneMessageHandler(instance, handlers),
            );

            channels.push(channel);
        }

        this.instanceChannelMap.set(instance.instanceId, channels);

        QueueAuthority.logger.info(`Successfully subscribed queues to world ${instance.world}!`);
    }

    // Disconnect world function
}
