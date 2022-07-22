import {AmqpConnectionManager} from 'amqp-connection-manager';
import {RabbitMQQueue} from './RabbitMQQueue';
import {PS2AlertsQueueInterface} from '../../../interfaces/PS2AlertsQueueInterface';
import config from '../../../config';
import {ConfirmChannel, ConsumeMessage} from 'amqplib';
import {Stream} from 'ps2census';
import AdminQueueMessage from '../../../data/AdminAggregator/AdminQueueMessage';
import ApplicationException from '../../../exceptions/ApplicationException';
import {Options} from 'amqplib/properties';
import {QueueMessageHandlerInterface} from '../../../interfaces/QueueMessageHandlerInterface';
import {getLogger} from '../../../logger';

export class AdminQueue extends RabbitMQQueue implements PS2AlertsQueueInterface {
    private static readonly classLogger = getLogger('AdminQueue');
    private readonly thisQueueName;

    constructor(
        connectionManager: AmqpConnectionManager,
        queueName: string,
        private readonly handler: QueueMessageHandlerInterface<AdminQueueMessage>,
    ) {
        super(connectionManager, queueName);
        this.thisQueueName = queueName;
    }

    public async connect(): Promise<void> {
        const queueOptions = {durable: false};
        await this.createChannel({
            json: true,
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            setup: async (channel: ConfirmChannel) => {
                await Promise.all([
                    channel.checkExchange(config.rabbitmq.exchange),
                    channel.assertQueue(this.thisQueueName, queueOptions),
                ]);
                await channel.bindQueue(this.thisQueueName, config.rabbitmq.exchange, '#');

                const consumerOptions: Options.Consume = {
                    priority: 0,
                };

                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                await channel.consume(this.thisQueueName, async (message) => {
                    if (!message) {
                        throw new ApplicationException('Admin Message was empty!', 'RabbitMQCensusStreamFactory.adminConsumer');
                    }

                    try {
                        // A middleware is added here track how long it takes messages to respond.
                        // This will mainly call the ZoneMiddleware Handler.
                        await this.handler.handle(
                            this.createMessage(message),
                            {
                                ack: () => this.handleMessageConfirm(message, 'ack'),
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
                            AdminQueue.classLogger.error(`[${this.thisQueueName}] Unable to properly handle admin message! ${err.message}`);
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
        const data: {eventName: string, worldId: string, payload: Stream.PS2Event} = this.parseRawMessage(message);

        return new AdminQueueMessage(data.payload);
    }
}
