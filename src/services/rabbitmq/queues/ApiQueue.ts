/* eslint-disable @typescript-eslint/naming-convention */
// noinspection JSMethodCanBeStatic

import {AmqpConnectionManager} from 'amqp-connection-manager';
import {RabbitMQQueue} from './RabbitMQQueue';
import {PS2AlertsQueueInterface} from '../../../interfaces/PS2AlertsQueueInterface';
import {ConfirmChannel} from 'amqplib';
import config from '../../../config';
import {getLogger} from '../../../logger';
import ApplicationException from '../../../exceptions/ApplicationException';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {jsonLogOutput} from '../../../utils/json';
import ExceptionHandler from '../../../handlers/system/ExceptionHandler';

export class ApiQueue extends RabbitMQQueue implements PS2AlertsQueueInterface {
    private static readonly classLogger = getLogger('ApiQueue');
    private readonly thisQueueName;

    constructor(
        connectionManager: AmqpConnectionManager,
        queueName: string,
        private readonly ttl: number,
        private readonly deadLetterExchange: string | undefined,
        private readonly deadLetterRoutingKey: string | undefined,
    ) {
        super(connectionManager, queueName);
        this.thisQueueName = queueName;
    }

    public async connect(): Promise<void> {
        const queueOptions = {
            durable: true,
            messageTtl: this.ttl, // 46 minutes
            deadLetterExchange: this.deadLetterExchange ?? undefined,
            deadLetterRoutingKey: this.deadLetterRoutingKey ?? undefined,
            arguments: {
                'x-queue-mode': 'lazy',
            },
        };

        await this.createChannel({
            json: true,
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            setup: async (channel: ConfirmChannel) => {
                await Promise.all([
                    channel.checkExchange(config.rabbitmq.exchange),
                    channel.assertQueue(this.thisQueueName, queueOptions),
                ]);
                await channel.bindQueue(this.thisQueueName, config.rabbitmq.exchange, '#');
            },
        });
    }

    public async send(msg: ApiMQMessage | ApiMQGlobalAggregateMessage): Promise<boolean | undefined> {
        if (!msg) {
            throw new ApplicationException(`${this.thisQueueName}] attempting to send a blank message! Pointless!`);
        }

        try {
            ApiQueue.classLogger.silly(`${this.thisQueueName}] Sending message: ${jsonLogOutput(msg)}`);
            await this.getChannel().sendToQueue(
                this.thisQueueName,
                msg,
                {persistent: true},
            );
            return true;
        } catch (err) {
            new ExceptionHandler(`${this.thisQueueName}] Unable to send message to queue!`, err, 'RabbitMQQueue');
        }
    }

    public async destroy(): Promise<void> {
        return await this.destroyQueue();
    }
}