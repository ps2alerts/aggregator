// noinspection JSMethodCanBeStatic

import {World} from '../../../ps2alerts-constants/world';
import {
    CensusClient,
    Death,
    FacilityControl,
    GainExperience,
    MetagameEvent, PlayerFacilityCapture, PlayerFacilityDefend,
    PS2Event,
    Stream,
    VehicleDestroy,
} from 'ps2census';
import {ConsumeMessage} from 'amqplib';
import ApplicationException from '../../../exceptions/ApplicationException';
import {jsonLogOutput} from '../../../utils/json';
import {getLogger} from '../../../logger';
import {ChannelWrapper} from 'amqp-connection-manager';
import {RabbitMQConnectionHandlerFactory} from '../RabbitMQConnectionHandlerFactory';
import Ps2censusMessageHandler from '../../../handlers/ps2census/Ps2censusMessageHandler';

export class WorldQueue {
    private static readonly logger = getLogger('WorldSubscription');
    private world: World;
    private queueName = '';
    private channelWrapper: ChannelWrapper;
    private connected = false;

    constructor(
        private readonly connectionHandlerFactory: RabbitMQConnectionHandlerFactory,
        private readonly censusClient: CensusClient,
        private readonly messageHandler: Ps2censusMessageHandler,
    ) {}

    public async connect(world: World, eventName: string): Promise<void> {
        this.world = world;
        this.queueName = `aggregator-${world}-${eventName}`;
        WorldQueue.logger.info(`[${this.queueName} Setting up world queue...`);

        let overrideOptions = {};

        if (eventName !== 'MetagameEvent') {
            overrideOptions = {messageTtl: 60 * 10 * 1000, maxPriority: 10};
        } else {
            overrideOptions = {maxPriority: 10};
        }

        this.channelWrapper = await this.connectionHandlerFactory.setupQueue(
            this.queueName,
            // eslint-disable-next-line @typescript-eslint/unbound-method
            this.handleMessage,
            overrideOptions,
            `${this.world}.${eventName}.*`,
        );

        this.connected = true;
    }

    // Deletes the queues then closes the channel.
    public async disconnect(): Promise<void> {
        WorldQueue.logger.info(`[${this.queueName} Destroying world queue...`);

        await this.connectionHandlerFactory.destroyQueue(this.queueName, this.channelWrapper);
        this.connected = false;
    }

    public getWorld(): World {
        return this.world;
    }

    public isConnected(): boolean {
        return this.connected;
    }

    // This has to be a method or shit goes REAL wonky.
    public readonly handleMessage = (msg: ConsumeMessage): void => {
        if (!msg) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new Error('Got empty message!');
        }

        try {
            const censusClass = this.parseMessage(msg);

            // Send off to the handler for further processing
            void this.messageHandler.handle(censusClass);

            this.channelWrapper.ack(msg);
            WorldQueue.logger.silly(`Acked message for ${this.queueName}`);
        } catch (err) {
            if (err instanceof ApplicationException) {
                WorldQueue.logger.error(`E : ${err.message}`);
            } else if (err instanceof Error) {
                WorldQueue.logger.error(`Unable to parse message properly. E : ${err.message}`);
            }

            this.channelWrapper.ack(msg);
            WorldQueue.logger.silly(`Acked failed message for ${this.queueName}`);
        }

        // // For some reason this does **NOT** catch exceptions, so we must ack in every case and not throw any exceptions within.
        // WorldSubscription.adminMessageHandlers.map(
        //     (handler: MessageQueueHandlerInterface<ParsedQueueMessage>) => void handler.handle(message),
        // );
    };

    private parseMessage(msg: ConsumeMessage): PS2Event {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: {eventName: string, worldId: string, payload: Stream.PS2Event};

        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            data = JSON.parse(msg.content.toString());
        } catch (e) {
            // Purposefully not ApplicationException
            throw new Error(`Unable to JSON parse message! Message: "${msg.content.toString()}"`);
        }

        WorldQueue.logger.silly(`Successfully parsed message! ${jsonLogOutput(data)}`);

        const censusClass = this.createCensusClass(data.payload);

        if (!censusClass) {
            throw new ApplicationException(`[${this.queueName}] Unknown message type received!`);
        }

        return censusClass;
    }

    // Here is where we actually parse the JSON into a proper PS2Census class which then is used throughout the application.
    private createCensusClass(payload: Stream.PS2Event): PS2Event {
        switch (payload.event_name) {
            case 'Death':
                return new Death(this.censusClient, payload);
            case 'FacilityControl':
                return new FacilityControl(this.censusClient, payload);
            case 'GainExperience':
                return new GainExperience(this.censusClient, payload);
            case 'MetagameEvent':
                return new MetagameEvent(this.censusClient, payload);
            case 'PlayerFacilityCapture':
                return new PlayerFacilityCapture(this.censusClient, payload);
            case 'PlayerFacilityDefend':
                return new PlayerFacilityDefend(this.censusClient, payload);
            case 'VehicleDestroy':
                return new VehicleDestroy(this.censusClient, payload);
            default: { throw new Error(`Unknown message received - ${payload.event_name}`); }
        }
    }
}
