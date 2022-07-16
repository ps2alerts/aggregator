/* eslint-disable @typescript-eslint/no-explicit-any */
// noinspection JSMethodCanBeStatic

import {inject, injectable} from 'inversify';
import {TYPES} from '../constants/types';
import {AmqpConnectionManager, ChannelWrapper} from 'amqp-connection-manager';
import {ConfirmChannel, ConsumeMessage} from 'amqplib';
import {
    CensusClient,
    Death,
    FacilityControl,
    GainExperience,
    MetagameEvent,
    PS2Event,
    Stream,
    VehicleDestroy,
} from 'ps2census';
import {getLogger} from '../logger';
import ApplicationException from '../exceptions/ApplicationException';
import {QueueMessageHandlerInterface} from '../interfaces/QueueMessageHandlerInterface';
import {Options} from 'amqplib/properties';
import AdminQueueMessage from '../data/AdminAggregator/AdminQueueMessage';
import RabbitMQQueue from '../services/rabbitmq/RabbitMQQueue';

@injectable()
export default class RabbitMQQueueFactory {
    private static readonly logger = getLogger('RabbitMQQueueFactory');

    constructor(
        @inject(TYPES.rabbitMqConnection) private readonly rabbit: AmqpConnectionManager,
        private readonly censusClient: CensusClient,
    ) {}

    // Above this, QueueAuthority creates these streams
    public async create(
        exchange: string,
        queueName: string,
        queueOptions: Options.AssertQueue = {},
        pattern: string | null = null,
        handler: QueueMessageHandlerInterface<any> | null = null,
    ): Promise<RabbitMQQueue> {
        pattern = pattern ?? '#'; // Default to all messages if a pattern isn't supplied

        const channel = this.rabbit.createChannel({
            json: true,
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            setup: async (channel: ConfirmChannel) => {
                pattern = pattern ?? '#'; // This is here because it's wrapped in a lambda and can't see the check above it
                queueOptions = {durable: true, ...queueOptions};

                await Promise.all([
                    channel.checkExchange(exchange),
                    channel.assertQueue(queueName, queueOptions),
                ]);
                await channel.bindQueue(queueName, exchange, pattern);

                // If the queue requires a consumer
                if (handler) {
                    const consumerOptions = {priority: this.getMessagePriority(pattern.split('.')[1] as never)};

                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    await channel.consume(queueName, async (message) => {
                        if (!message) {
                            throw new ApplicationException('Message was empty!', 'RabbitMQCensusStreamFactory');
                        }

                        try {
                            await handler.handle(this.parseMessage(message), {
                                ack: () => this.handleMessageConfirm(channel, message, 'ack'),
                                nack: () => this.handleMessageConfirm(channel, message, 'nack'),
                                // requeue: () => return , // DL Requeue
                            });
                        } catch (err) {
                            // Do not throw an exception or the app will terminate!
                            if (err instanceof Error) {
                                RabbitMQQueueFactory.logger.error(`[${queueName}] Unable to properly handle message! ${err.message}`);
                            }

                            channel.ack(message); // Critical error, probably unprocessable so we're chucking
                        }
                    }, consumerOptions);
                }
            },
        });

        this.registerListeners(channel, queueName);

        // Ensure the connection is actually there
        await channel.waitForConnect();

        return new RabbitMQQueue(exchange, queueName, pattern, channel);
    }

    private registerListeners(channel: ChannelWrapper, queueName: string): void {
        channel.on('connect', () => {
            RabbitMQQueueFactory.logger.info(`[${queueName}] connected!`);
        });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        channel.on('close', () => {
            RabbitMQQueueFactory.logger.error(`[${queueName}] closed!`);
        });

        channel.on('error', (err) => {
            if (err instanceof Error) {
                RabbitMQQueueFactory.logger.error(`[${queueName}] rabbit error! ${err.message}`);
            }
        });
    }

    private getMessagePriority(queueEventName: Stream.PS2EventNames): number {
        switch (queueEventName) {
            case 'MetagameEvent':
                return 1;
            case 'FacilityControl':
                return 2;
            case 'Death':
                return 3;
            case 'PlayerFacilityCapture':
            case 'PlayerFacilityDefend':
                return 4;
            case 'VehicleDestroy':
                return 5;
            case 'GainExperience':
                return 9;
            default:
                return 10;
        }
    }

    private parseMessage(msg: ConsumeMessage): PS2Event | AdminQueueMessage {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: {eventName: string, worldId: string, payload: Stream.PS2Event};

        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            data = JSON.parse(msg.content.toString());
        } catch (e) {
            throw new ApplicationException(`Unable to JSON parse message! Message: "${msg.content.toString()}"`, 'RabbitMQCensusStreamFactory');
        }

        if (data.eventName === 'AdminMessage') {
            return new AdminQueueMessage(data.payload);
        }

        const censusClass = this.createMessageClass(data.payload);

        if (!censusClass) {
            throw new ApplicationException('Unknown message type received!');
        }

        return censusClass;
    }

    private createMessageClass(payload: Stream.PS2Event): PS2Event | undefined {
        switch (payload.event_name) {
            case 'AchievementEarned':
                return;
            case 'BattleRankUp':
                return;
            case 'ContinentLock':
                return;
            case 'ContinentUnlock':
                return;
            case 'Death':
                return new Death(this.censusClient, payload);
            case 'FacilityControl':
                return new FacilityControl(this.censusClient, payload);
            case 'GainExperience':
                return new GainExperience(this.censusClient, payload);
            case 'ItemAdded':
                return;
            case 'MetagameEvent':
                return new MetagameEvent(this.censusClient, payload);
            case 'PlayerFacilityCapture':
                return;
            case 'PlayerFacilityDefend':
                return;
            case 'PlayerLogin':
                return;
            case 'PlayerLogout':
                return;
            case 'SkillAdded':
                return;
            case 'VehicleDestroy':
                return new VehicleDestroy(this.censusClient, payload);
        }
    }

    private handleMessageConfirm(channel: ConfirmChannel, message: ConsumeMessage, action: 'ack' | 'nack'): void {
        try {
            if (action === 'ack') {
                channel.ack(message);
            } else {
                channel.nack(message);
            }
        } catch (err) {
            // Handle the channel closed first, before processing anything else
            if (err instanceof Error) {
                // Annoyingly ampqlib doesn't expose the IllegalOperationError type, so we have to capture it here via string checks
                if (err.message.includes('Channel closed')) {
                    RabbitMQQueueFactory.logger.warn('Attempted to (n)ack the message when the channel was closed');
                    return;
                }

                RabbitMQQueueFactory.logger.error(`RabbitMQ error occurred when attempting to (n)ack message! ${err.message}`);
            }
        }
    }
}
