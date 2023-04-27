// noinspection JSMethodCanBeStatic

import {AmqpConnectionManager} from 'amqp-connection-manager';
import {RabbitMQQueue} from './RabbitMQQueue';
import {PS2AlertsQueueInterface} from '../../../interfaces/PS2AlertsQueueInterface';
import {CensusClient, Death, FacilityControl, GainExperience, PS2Event, Stream, VehicleDestroy} from 'ps2census';
import {ConfirmChannel, ConsumeMessage} from 'amqplib';
import {Options} from 'amqplib/properties';
import {QueueMessageHandlerInterface} from '../../../interfaces/QueueMessageHandlerInterface';
import EventTimingMiddlewareHandler from '../../../middlewares/EventTimingMiddlewareHandler';
import ApplicationException from '../../../exceptions/ApplicationException';
import InstanceAbstract from '../../../instances/InstanceAbstract';
import {Logger} from '@nestjs/common';
import MetricsHandler from '../../../handlers/MetricsHandler';

export class InstanceEventQueue extends RabbitMQQueue implements PS2AlertsQueueInterface {
    private static readonly classLogger = new Logger('InstanceEventQueue');

    constructor(
        connectionManager: AmqpConnectionManager,
        queueName: string,
        metricsHandler: MetricsHandler,
        private readonly topicExchange: string,
        private readonly pattern: string,
        private readonly prefetch: number,
        private readonly instance: InstanceAbstract,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        private readonly handler: QueueMessageHandlerInterface<PS2Event<any>>,
        private readonly timingMiddlewareHandler: EventTimingMiddlewareHandler,
        private readonly censusClient: CensusClient,
    ) {
        super(connectionManager, queueName, metricsHandler);
    }

    public async connect(): Promise<void> {
        const eventName = this.pattern.split('.')[1];
        const queueOptions: Options.AssertQueue = {
            durable: false,
            maxPriority: 10,
            messageTtl: eventName === 'FacilityControl' ? 60000 : 20 * 60 * 1000, // Grace period for the aggregator to process the message. FacilityControl is set to 60s as it's time urgent
            expires: 15 * 60 * 1000, // Auto deletes the queue if not picked up by QueueAuthority. This is left quite long in case of a crash loop
        };

        await this.createChannel({
            json: true,
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            setup: async (channel: ConfirmChannel): Promise<void> => {
                await Promise.all([
                    channel.checkExchange(this.topicExchange),
                    channel.assertQueue(this.queueName, queueOptions),
                ]);
                await channel.bindQueue(this.queueName, this.topicExchange, this.pattern);

                // If the queue requires a consumer
                const consumerOptions: Options.Consume = {
                    priority: this.getMessagePriority(this.pattern.split('.')[1] as never),
                };

                await channel.prefetch(this.prefetch);

                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                await channel.consume(this.queueName, async (message) => {
                    if (!message) {
                        InstanceEventQueue.classLogger.error(`[${this.queueName}] Message was empty!`);
                        return;
                    }

                    try {
                        // A middleware is added here track how long it takes messages to respond.
                        // This will mainly call the ZoneMessageHandler.
                        await this.timingMiddlewareHandler.handle(
                            this.createPs2Event(message),
                            {
                                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                ack: () => this.handleMessageConfirm(message, 'ack'),
                                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                retry: () => this.handleMessageConfirm(message, 'retry'),
                                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                delay: () => {
                                    // await this.handleMessageDelay(message, 15000, this.pattern, started);
                                    this.handleMessageConfirm(message, 'discard'); // Just ack the message, effectively discarding it
                                },
                            },
                            this.handler,
                        );
                    } catch (err) {
                        // Do not throw an exception or the app will terminate!
                        if (err instanceof Error) {
                            InstanceEventQueue.classLogger.error(`[${this.queueName}] Unable to properly handle message! ${err.message}`);
                        }

                        this.handleMessageConfirm(message, 'discard'); // Critical error, probably unprocessable so we're chucking
                    }
                }, consumerOptions);
            },
        });
    }

    public async destroy(): Promise<void> {
        return await this.destroyQueue();
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private createPs2Event(message: ConsumeMessage): PS2Event<any> {
        const data: {eventName: string, worldId: string, payload: Stream.PS2Event} = this.parseRawMessage(message);

        switch (data.payload.event_name) {
            case 'AchievementEarned':
            case 'BattleRankUp':
            case 'ContinentLock':
            case 'ItemAdded':
            case 'PlayerFacilityCapture':
            case 'PlayerFacilityDefend':
            case 'PlayerLogin':
            case 'PlayerLogout':
            case 'SkillAdded':
                throw new ApplicationException('Unknown message type received!');
            case 'MetagameEvent': // Handled by MetagameEventQueue and should not be coming to this queue
                throw new ApplicationException('Received a metagame event message in an instance event queue!');
            case 'Death':
                return new Death(this.censusClient, data.payload);
            case 'FacilityControl':
                return new FacilityControl(this.censusClient, data.payload);
            case 'GainExperience':
                return new GainExperience(this.censusClient, data.payload);
            case 'VehicleDestroy':
                return new VehicleDestroy(this.censusClient, data.payload);
            case undefined: // In case tools sending simulated messages have the format wrong
                throw new ApplicationException('Message type was undefined!');
        }
    }
}
