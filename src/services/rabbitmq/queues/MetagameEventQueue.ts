import {AmqpConnectionManager} from 'amqp-connection-manager';
import {RabbitMQQueue} from './RabbitMQQueue';
import {PS2AlertsQueueInterface} from '../../../interfaces/PS2AlertsQueueInterface';
import config from '../../../config';
import {ConfirmChannel, ConsumeMessage} from 'amqplib';
import {CensusClient, MetagameEvent, Stream} from 'ps2census';
import ApplicationException from '../../../exceptions/ApplicationException';
import {Options} from 'amqplib/properties';
import {QueueMessageHandlerInterface} from '../../../interfaces/QueueMessageHandlerInterface';
import {getLogger} from '../../../logger';

export class MetagameEventQueue extends RabbitMQQueue implements PS2AlertsQueueInterface {
    private static readonly classLogger = getLogger('MetagameEventQueue');
    private readonly thisQueueName;

    constructor(
        connectionManager: AmqpConnectionManager,
        queueName: string,
        private readonly pattern: string,
        private readonly handler: QueueMessageHandlerInterface<MetagameEvent>,
        private readonly censusClient: CensusClient,
    ) {
        super(connectionManager, queueName);
        this.thisQueueName = queueName;
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
                    channel.checkExchange(config.rabbitmq.topicExchange),
                    channel.assertQueue(this.thisQueueName, queueOptions),
                ]);
                await channel.bindQueue(this.thisQueueName, config.rabbitmq.topicExchange, this.pattern);

                const consumerOptions: Options.Consume = {
                    priority: 0,
                };

                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                await channel.consume(this.thisQueueName, async (message) => {
                    if (!message) {
                        throw new ApplicationException('MetagameEvent Message was empty!', 'RabbitMQCensusStreamFactory.MetgameEventQueue');
                    }

                    try {
                        // A middleware is added here track how long it takes messages to respond.
                        // This will mainly call the ZoneMiddleware Handler.
                        await this.handler.handle(
                            this.createMessage(message),
                            {
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
                            MetagameEventQueue.classLogger.error(`[${this.thisQueueName}] Unable to properly handle MetagameEvent message! ${err.message}`);
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

        return new MetagameEvent(this.censusClient, data.payload);
    }
}
