/* eslint-disable @typescript-eslint/naming-convention */
// noinspection JSMethodCanBeStatic

import {AmqpConnectionManager} from 'amqp-connection-manager';
import {RabbitMQQueue} from './RabbitMQQueue';
import {PS2AlertsQueueInterface} from '../../../interfaces/PS2AlertsQueueInterface';
import {ConfirmChannel} from 'amqplib';
import ApplicationException from '../../../exceptions/ApplicationException';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {jsonLogOutput} from '../../../utils/json';
import ExceptionHandler from '../../../handlers/system/ExceptionHandler';
import {Logger} from '@nestjs/common';
import MetricsHandler from '../../../handlers/MetricsHandler';

export class ApiQueue extends RabbitMQQueue implements PS2AlertsQueueInterface {
    private static readonly classLogger = new Logger('ApiQueue');

    constructor(
        connectionManager: AmqpConnectionManager,
        queueName: string,
        metricsHandler: MetricsHandler,
        private readonly exchange: string,
        private readonly ttl: number,
        private readonly durable: boolean,
        private readonly deadLetterExchange: string | undefined,
        private readonly deadLetterRoutingKey: string | undefined,
    ) {
        super(connectionManager, queueName, metricsHandler);
    }

    public async connect(): Promise<void> {
        // A non-durable queue is memory-only: lazy mode would write every message to disk regardless
        const queueOptions = {
            durable: this.durable,
            messageTtl: this.ttl,
            deadLetterExchange: this.deadLetterExchange ?? undefined,
            deadLetterRoutingKey: this.deadLetterRoutingKey ?? undefined,
            arguments: this.durable ? {'x-queue-mode': 'lazy'} : {},
        };

        await this.createChannel({
            json: true,
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            setup: async (channel: ConfirmChannel) => {
                await Promise.all([
                    channel.checkExchange(this.exchange),
                    channel.assertQueue(this.queueName, queueOptions),
                ]);
                await channel.bindQueue(this.queueName, this.exchange, '#');
            },
        });
    }

    public async send(msg: ApiMQMessage | ApiMQGlobalAggregateMessage): Promise<boolean | undefined> {
        if (!msg) {
            throw new ApplicationException(`${this.queueName}] attempting to send a blank message! Pointless!`);
        }

        try {
            ApiQueue.classLogger.verbose(`${this.queueName}] Sending message: ${jsonLogOutput(msg)}`);
            await this.getChannel().sendToQueue(
                this.queueName,
                msg,
                {persistent: this.durable},
            );
            return true;
        } catch (err) {
            new ExceptionHandler(`${this.queueName}] Unable to send message to queue!`, err, 'RabbitMQQueue');
        }
    }

    public async destroy(): Promise<void> {
        return await this.destroyQueue();
    }
}
