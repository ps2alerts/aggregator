import {AmqpConnectionManager} from 'amqp-connection-manager';
import {RabbitMQQueue} from './RabbitMQQueue';
import {PS2AlertsQueueInterface} from '../../../interfaces/PS2AlertsQueueInterface';
import {ConfirmChannel, ConsumeMessage} from 'amqplib';
import AdminQueueMessage from '../../../data/AdminAggregator/AdminQueueMessage';
import ApplicationException from '../../../exceptions/ApplicationException';
import {Options} from 'amqplib/properties';
import {QueueMessageHandlerInterface} from '../../../interfaces/QueueMessageHandlerInterface';
import {Logger} from '@nestjs/common';
import MetricsHandler from '../../../handlers/MetricsHandler';

export interface AdminQueueMessageContentInterface {
    action: string;
    body: never;
}

export class AdminQueue extends RabbitMQQueue implements PS2AlertsQueueInterface {
    private static readonly classLogger = new Logger('AdminQueue');

    constructor(
        connectionManager: AmqpConnectionManager,
        queueName: string,
        metricsHandler: MetricsHandler,
        private readonly exchange: string,
        private readonly handler: QueueMessageHandlerInterface<AdminQueueMessage>,
    ) {
        super(connectionManager, queueName, metricsHandler);
    }

    public async connect(): Promise<void> {
        const queueOptions = {durable: false};
        await this.createChannel({
            json: true,
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            setup: async (channel: ConfirmChannel) => {
                await Promise.all([
                    channel.checkExchange(this.exchange),
                    channel.assertQueue(this.queueName, queueOptions),
                ]);
                await channel.bindQueue(this.queueName, this.exchange, '#');

                const consumerOptions: Options.Consume = {
                    priority: 0,
                };

                const started = new Date();

                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                await channel.consume(this.queueName, async (message) => {
                    if (!message) {
                        throw new ApplicationException('Admin Message was empty!', 'RabbitMQCensusStreamFactory.adminConsumer');
                    }

                    try {
                        // A middleware is added here track how long it takes messages to respond.
                        // This will mainly call the ZoneMiddleware Handler.
                        await this.handler.handle(
                            this.createMessage(message),
                            {
                                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                ack: async () => await this.handleMessageConfirm(message, 'ack', started),
                                retry: () => {
                                    return true; // Not supported
                                },
                                delay: () => {
                                    return true; // Not supported
                                },
                            },
                        );
                    } catch (err) {
                        // Do not throw an exception or the app will terminate!
                        if (err instanceof Error) {
                            AdminQueue.classLogger.error(`[${this.queueName}] Unable to properly handle admin message! ${err.message}`);
                        }

                        channel.ack(message);
                    }
                }, consumerOptions);
            },
        });
    }

    public async send(message: unknown): Promise<void> {
        await this.sendMessage(message);
    }

    public async destroy(): Promise<void> {
        await this.destroyQueue();
    }

    private createMessage(message: ConsumeMessage): AdminQueueMessage {
        const data: {payload: AdminQueueMessageContentInterface} = this.parseRawMessage(message);
        return new AdminQueueMessage(data.payload);
    }
}
