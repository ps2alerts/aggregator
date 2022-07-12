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

@injectable()
export default class RabbitMQChannelFactory {
    private static readonly logger = getLogger('RabbitMQChannelFactory');
    private channel: ChannelWrapper;

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
    ): Promise<ChannelWrapper> {
        const channel = this.rabbit.createChannel({
            json: true,
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            setup: async (channel: ConfirmChannel) => {
                pattern = pattern ?? '#'; // Default to all messages if a pattern isn't supplied
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
                                ack: () => channel.ack(message),
                                nack: () => channel.nack(message),
                                // requeue: () => return , // DL Requeue
                            });
                        } catch (err) {
                            // Do not throw an exception or the app will terminate!
                            if (err instanceof Error) {
                                RabbitMQChannelFactory.logger.error(`[${queueName}] Unable to properly handle message! ${err.message}`);
                            }

                            channel.ack(message); // Critical error, probably unprocessable so we're chucking
                        }
                    }, consumerOptions);
                }
            },
        });

        channel.on('connect', () => {
            RabbitMQChannelFactory.logger.info(`[${queueName}] connected!`);
        });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        channel.on('close', async () => {
            RabbitMQChannelFactory.logger.error(`[${queueName}] closed!`);

            RabbitMQChannelFactory.logger.info(`[${queueName}] attempting reconnect...`);
            await this.destroy();
            this.channel = await this.create(exchange, queueName, queueOptions, pattern, handler);

            RabbitMQChannelFactory.logger.info(`[${queueName}] reconnected!`);
        });

        channel.on('error', (err) => {
            if (err instanceof Error) {
                RabbitMQChannelFactory.logger.error(`[${queueName}] rabbit error! ${err.message}`);
            }
        });

        // Ensure the connection is actually there
        await channel.waitForConnect();
        this.channel = channel;
        return this.channel;
    }

    public async destroy(): Promise<void> {
        this.channel.removeAllListeners();
        await this.channel.close();
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
}
