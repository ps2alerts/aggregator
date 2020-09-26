import {ChannelWrapper, connect} from 'amqp-connection-manager';
import {ConfirmChannel} from 'amqplib';
import {getLogger} from '../../logger';
import RabbitMQ from '../../config/rabbitmq';
import ApplicationException from '../../exceptions/ApplicationException';
import {injectable} from 'inversify';

@injectable()
export class RabbitMQConnectionHandlerFactory {
    private static readonly logger = getLogger('RabbitMQConnectionHandler');
    private readonly config: RabbitMQ;

    constructor(rabbitMQConfig: RabbitMQ) {
        this.config = rabbitMQConfig;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
    public async setupConnection(queueName: string, callback: any | null): Promise<ChannelWrapper> {
        let connected = false;
        const vhost = this.config.vhost ? `/${this.config.vhost}` : '';
        const connectionString = `amqp://${this.config.user}:${this.config.pass}@${this.config.host}:${this.config.port}${vhost}?heartbeat=${this.config.heartbeat}&connection_timeout=${this.config.timeout}`;

        RabbitMQConnectionHandlerFactory.logger.debug(`[${queueName}] Setting up queue...`);
        RabbitMQConnectionHandlerFactory.logger.debug(connectionString);

        const connection = connect([connectionString]);
        const channelWrapper = connection.createChannel({
            json: true,
            setup: (channel: ConfirmChannel) => {
                return Promise.all([
                    channel.assertQueue(queueName, {durable: true}),
                    channel.bindQueue(queueName, this.config.exchange, 'create'),
                    callback ? channel.consume(queueName, callback) : null,
                ]);
            },
        });

        channelWrapper.on('connect', () => {
            RabbitMQConnectionHandlerFactory.logger.info(`[${queueName}] connected!`);
            connected = true;
        });

        channelWrapper.on('close', () => {
            RabbitMQConnectionHandlerFactory.logger.error(`[${queueName}] closed!`);
        });

        channelWrapper.on('error', (error) => {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string,@typescript-eslint/restrict-template-expressions
            RabbitMQConnectionHandlerFactory.logger.error(`[${queueName}] error! ${error}`);
        });

        RabbitMQConnectionHandlerFactory.logger.debug(`[${queueName}] Connecting queue...`);

        // Since for some reason the connection manager doesn't throw anything when timing out, handle it here.
        const timeout = new Promise((resolve, reject) => {
            const id = setTimeout(() => {
                clearTimeout(id);

                if (!connected) {
                    reject(new Error('Timed out connecting to MQ!'));
                } else {
                    resolve();
                }
            }, this.config.timeout);
        });

        await Promise.race([
            channelWrapper.waitForConnect(),
            timeout,
        ]).catch((err) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            throw new ApplicationException(err.message);
        });

        return channelWrapper;
    }
}
