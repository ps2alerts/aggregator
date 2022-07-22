// noinspection JSMethodCanBeStatic

import {AmqpConnectionManager} from 'amqp-connection-manager';
import {RabbitMQQueue} from './RabbitMQQueue';
import {PS2AlertsQueueInterface} from '../../../interfaces/PS2AlertsQueueInterface';
import {
    CensusClient,
    Death,
    FacilityControl,
    GainExperience,
    PS2Event,
    Stream,
    VehicleDestroy,
} from 'ps2census';
import {ConfirmChannel, ConsumeMessage} from 'amqplib';
import {Options} from 'amqplib/properties';
import {QueueMessageHandlerInterface} from '../../../interfaces/QueueMessageHandlerInterface';
import config from '../../../config';
import {getLogger} from '../../../logger';
import TimingMiddlewareHandler from '../../../middlewares/TimingMiddlewareHandler';
import ApplicationException from '../../../exceptions/ApplicationException';
import InstanceAbstract from '../../../instances/InstanceAbstract';

export class InstanceEventQueue extends RabbitMQQueue implements PS2AlertsQueueInterface {
    private static readonly classLogger = getLogger('InstanceEventQueue');
    private readonly exchange = config.rabbitmq.topicExchange;
    private readonly thisQueueName;

    constructor(
        connectionManager: AmqpConnectionManager,
        queueName: string,
        private readonly pattern: string,
        private readonly prefetch: number,
        private readonly instance: InstanceAbstract,
        private readonly handler: QueueMessageHandlerInterface<PS2Event>,
        private readonly timingMiddlewareHandler: TimingMiddlewareHandler,
        private readonly censusClient: CensusClient,
    ) {
        super(connectionManager, queueName);
        this.thisQueueName = queueName;
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
            setup: async (channel: ConfirmChannel) => {
                await Promise.all([
                    channel.checkExchange(this.exchange),
                    channel.assertQueue(this.thisQueueName, queueOptions),
                ]);
                await channel.bindQueue(this.thisQueueName, this.exchange, this.pattern);

                // If the queue requires a consumer
                const consumerOptions: Options.Consume = {
                    priority: this.getMessagePriority(this.pattern.split('.')[1] as never),
                };

                await channel.prefetch(this.prefetch);

                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                await channel.consume(this.thisQueueName, async (message) => {
                    if (!message) {
                        InstanceEventQueue.classLogger.error(`[${this.thisQueueName}] Message was empty!`);
                        return;
                    }

                    try {
                        // A middleware is added here track how long it takes messages to respond.
                        // This will mainly call the ZoneMessageHandler.
                        await this.timingMiddlewareHandler.handle(
                            this.createPs2Event(message),
                            {
                                ack: () => this.handleMessageConfirm(message, 'ack'),
                                retry: () => this.handleMessageConfirm(message, 'retry'),
                                // delay: (ms: number) => this.handleMessageDelay(message, ms, this.pattern),
                                delay: () => {
                                    return true;
                                }, // TODO: IMPLEMENT
                            },
                            this.handler,
                        );
                    } catch (err) {
                        // Do not throw an exception or the app will terminate!
                        if (err instanceof Error) {
                            InstanceEventQueue.classLogger.error(`[${this.thisQueueName}] Unable to properly handle message! ${err.message}`);
                        }

                        this.handleMessageConfirm(message, 'ack'); // Critical error, probably unprocessable so we're chucking
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

    private createPs2Event(message: ConsumeMessage): PS2Event {
        const data: {eventName: string, worldId: string, payload: Stream.PS2Event} = this.parseRawMessage(message);

        switch (data.payload.event_name) {
            case 'AchievementEarned':
            case 'BattleRankUp':
            case 'ContinentLock':
            case 'ContinentUnlock':
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
        }
    }
}
