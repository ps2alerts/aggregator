import {AmqpConnectionManager} from 'amqp-connection-manager';
import {RabbitMQQueue} from './RabbitMQQueue';
import {PS2AlertsQueueInterface} from '../../../interfaces/PS2AlertsQueueInterface';
import {ConfirmChannel, ConsumeMessage} from 'amqplib';
import {CensusClient, MetagameEvent, Stream} from 'ps2census';
import ApplicationException from '../../../exceptions/ApplicationException';
import {Options} from 'amqplib/properties';
import {QueueMessageHandlerInterface} from '../../../interfaces/QueueMessageHandlerInterface';
import {Logger} from '@nestjs/common';
import MetricsHandler from '../../../handlers/MetricsHandler';

export class MetagameEventQueue extends RabbitMQQueue implements PS2AlertsQueueInterface {
    private static readonly classLogger = new Logger('MetagameEventQueue');

    constructor(
        connectionManager: AmqpConnectionManager,
        queueName: string,
        metricsHandler: MetricsHandler,
        private readonly topicExchange: string,
        private readonly pattern: string,
        private readonly handler: QueueMessageHandlerInterface<MetagameEvent>,
        private readonly censusClient: CensusClient,
    ) {
        super(connectionManager, queueName, metricsHandler);
    }

    public async connect(): Promise<void> {
        const queueOptions = {
            durable: true,
            maxPriority: 2,
            messageTtl: 5 * 60 * 1000,
        };
        await this.createChannel({
            json: true,
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            setup: async (channel: ConfirmChannel) => {
                await Promise.all([
                    channel.checkExchange(this.topicExchange),
                    channel.assertQueue(this.queueName, queueOptions),
                ]);
                await channel.bindQueue(this.queueName, this.topicExchange, this.pattern);

                const consumerOptions: Options.Consume = {
                    priority: 0,
                };

                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                await channel.consume(this.queueName, async (message) => {
                    if (!message) {
                        throw new ApplicationException('MetagameEvent Message was empty!', 'RabbitMQCensusStreamFactory.MetgameEventQueue');
                    }

                    try {
                        // A middleware is added here track how long it takes messages to respond.
                        // This will mainly call the ZoneMiddleware Handler.
                        await this.handler.handle(
                            this.createMessage(message),
                            {
                                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                ack: () => this.handleMessageConfirm(message, 'ack'),
                                retry: () => {
                                    return true; // TODO: Implement
                                },
                                delay: () => {
                                    return true; // TODO: Implement
                                },
                            },
                        );
                    } catch (err) {
                        // Do not throw an exception or the app will terminate!
                        if (err instanceof Error) {
                            MetagameEventQueue.classLogger.error(`[${this.queueName}] Unable to properly handle MetagameEvent message! ${err.message}`);
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

    private createMessage(message: ConsumeMessage): MetagameEvent {
        const data: {eventName: string, worldId: string, payload: Stream.PS2Event} = this.parseRawMessage(message);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new MetagameEvent(this.censusClient, data.payload as any);
    }
}
