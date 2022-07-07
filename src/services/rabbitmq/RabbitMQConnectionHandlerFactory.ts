// noinspection JSMethodCanBeStatic

import {ChannelWrapper, connect} from 'amqp-connection-manager';
import {ConfirmChannel} from 'amqplib';
import {getLogger} from '../../logger';
import RabbitMQ from '../../config/rabbitmq';
import ApplicationException from '../../exceptions/ApplicationException';
import {injectable} from 'inversify';
import {IAmqpConnectionManager} from 'amqp-connection-manager/dist/esm/AmqpConnectionManager';
import {Stream} from 'ps2census';

@injectable()
export class RabbitMQConnectionHandlerFactory {
    private static readonly logger = getLogger('RabbitMQConnectionHandler');
    private readonly config: RabbitMQ;
    private connected = false;
    private readonly connectionString: string = '';

    constructor(rabbitMQConfig: RabbitMQ) {
        this.config = rabbitMQConfig;
        this.connectionString = `amqp://${this.config.user}:${this.config.pass}@${this.config.host}:${this.config.port}${this.config.vhost}?heartbeat=${this.config.heartbeat}&connection_timeout=${this.config.timeout}`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
    public async setupQueue(
        queueName: string,
        callback: never | null,
        overrideOptions = {},
        pattern = '',
    ): Promise<ChannelWrapper> {
        RabbitMQConnectionHandlerFactory.logger.debug(`[${queueName}] Setting up queue...`);

        const channelWrapper = this.createChannelWrapper(queueName, callback, overrideOptions, pattern);

        void this.setupEventListeners(channelWrapper, queueName);

        RabbitMQConnectionHandlerFactory.logger.debug(`[${queueName}] Connecting queue...`);
        await this.connect(channelWrapper);

        return channelWrapper;
    }

    public async destroyQueue(queueName: string, channelWrapper: ChannelWrapper): Promise<void> {
        RabbitMQConnectionHandlerFactory.logger.debug(`[${queueName}] Destroying queue...`);

        channelWrapper.removeAllListeners();
        await channelWrapper.deleteQueue(queueName);
        await channelWrapper.close();

        RabbitMQConnectionHandlerFactory.logger.debug(`[${queueName}] Queue destroyed.`);
    }

    private setupEventListeners(channelWrapper: ChannelWrapper, queueName: string): void {
        // Define the events here and attach them to the channel wrapper
        channelWrapper.on('connect', () => {
            RabbitMQConnectionHandlerFactory.logger.info(`[${queueName}] connected!`);
            this.connected = true;
        });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        channelWrapper.on('close', async () => {
            RabbitMQConnectionHandlerFactory.logger.error(`[${queueName}] closed!`);
            this.connected = false;

            RabbitMQConnectionHandlerFactory.logger.info(`[${queueName}] attempting reconnect...`);
            await this.connect(channelWrapper);
        });

        channelWrapper.on('error', (error) => {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string,@typescript-eslint/restrict-template-expressions
            RabbitMQConnectionHandlerFactory.logger.error(`[${queueName}] error! ${error}`);
        });
    }

    private async connect(channelWrapper: ChannelWrapper): Promise<void> {
        // Since for some reason the connection manager doesn't throw anything when timing out, handle it here.
        const timeout = new Promise((resolve, reject) => {
            const id = setTimeout(() => {
                clearTimeout(id);

                if (!this.connected) {
                    reject(new Error('Timed out connecting to MQ!'));
                } else {
                    this.connected = true;
                    resolve(true);
                }
            }, this.config.timeout);
        });

        await Promise.race([
            channelWrapper.waitForConnect(),
            timeout,
        ]).catch((err) => {
            if (err instanceof Error) {
                throw new ApplicationException(err.message);
            }

            throw new ApplicationException('RabbitMQ Connection failure!!');
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
    private createChannelWrapper(queueName: string, callback: any | null, overrideOptions = {}, pattern = ''): ChannelWrapper {
        RabbitMQConnectionHandlerFactory.logger.silly(this.connectionString);
        const connection: IAmqpConnectionManager = connect([this.connectionString]);
        const queueOptions = {durable: true, ...overrideOptions};
        const consumerOptions = {priority: this.getMessagePriority(queueName.split('-')[2] as never)};

        return connection.createChannel({
            json: true,
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            setup: (channel: ConfirmChannel) => {
                return Promise.all([
                    channel.assertQueue(queueName, queueOptions),
                    channel.bindQueue(
                        queueName,
                        pattern ? this.config.topicExchange : this.config.exchange,
                        pattern ?? 'create',
                    ),
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    callback ? channel.consume(queueName, callback, consumerOptions) : null,
                ]);
            },
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
}
