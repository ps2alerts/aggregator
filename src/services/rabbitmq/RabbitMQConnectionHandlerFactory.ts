/* eslint-disable @typescript-eslint/naming-convention */
import {ChannelWrapper, connect} from 'amqp-connection-manager';
import {ConfirmChannel} from 'amqplib';
import {getLogger} from '../../logger';
import ApplicationException from '../../exceptions/ApplicationException';
import {injectable} from 'inversify';
import config from '../../config';

@injectable()
export class RabbitMQConnectionHandlerFactory {
    private static readonly logger = getLogger('RabbitMQConnectionHandler');
    private connected = false;
    private channelWrapper: ChannelWrapper;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
    public async setupQueue(queueName: string, callback: any | null, overrideOptions = {}): Promise<ChannelWrapper> {
        const vhost = config.rabbitmq.vhost ? `/${config.rabbitmq.vhost}` : '';
        const connectionString = `amqp://${config.rabbitmq.user}:${config.rabbitmq.pass}@${config.rabbitmq.host}:${config.rabbitmq.port}${vhost}?heartbeat=${config.rabbitmq.heartbeat}&connection_timeout=${config.rabbitmq.timeout}`;

        RabbitMQConnectionHandlerFactory.logger.silly(`[${queueName}] Setting up queue...`);
        RabbitMQConnectionHandlerFactory.logger.silly(connectionString);

        const connection = connect([connectionString]);
        const options = {
            durable: true,
            arguments: {
                'x-max-priority': 0, // No priority
                'x-queue-mode': 'lazy',
            },
            prefetch: config.rabbitmq.aggregatorPrefetch, // Overridable
            ...overrideOptions,
        };

        this.channelWrapper = connection.createChannel({
            json: true,
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            setup: (channel: ConfirmChannel) => {
                void channel.assertQueue(queueName, options);
                void channel.bindQueue(queueName, config.rabbitmq.exchange, 'create');

                if (callback) {
                    void channel.prefetch(options.prefetch); // Why this isn't in the options array I'll never know
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    void channel.consume(queueName, callback);
                }
            },
        });

        this.channelWrapper.on('connect', () => {
            RabbitMQConnectionHandlerFactory.logger.info(`[${queueName}] connected!`);
            this.connected = true;
        });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.channelWrapper.on('close', () => {
            RabbitMQConnectionHandlerFactory.logger.error(`[${queueName}] closed!`);
            this.connected = false;

            RabbitMQConnectionHandlerFactory.logger.info(`[${queueName}] attempting reconnect...`);
            void this.connect();
        });

        this.channelWrapper.on('error', (error) => {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string,@typescript-eslint/restrict-template-expressions
            RabbitMQConnectionHandlerFactory.logger.error(`[${queueName}] error! ${error}`);
        });

        RabbitMQConnectionHandlerFactory.logger.silly(`[${queueName}] Connecting queue...`);

        await this.connect();

        return this.channelWrapper;
    }

    private async connect(): Promise<void> {
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
            }, config.rabbitmq.timeout);
        });

        await Promise.race([
            this.channelWrapper.waitForConnect(),
            timeout,
        ]).catch((err) => {
            if (err instanceof Error) {
                throw new ApplicationException(err.message);
            }

            throw new ApplicationException('RabbitMQ Connection failure!!');
        });
    }
}
