import {ChannelWrapper, connect} from 'amqp-connection-manager';
import {ConfirmChannel, ConsumeMessage} from 'amqplib';
import {getLogger} from '../../../logger';
import RabbitMQ from '../../../config/rabbitmq';
import ParsedQueueMessage from '../../../data/ParsedQueueMessage';
import ApplicationException from '../../../exceptions/ApplicationException';
import {jsonLogOutput} from '../../../utils/json';

export abstract class BaseChannelWrapper {
    private static readonly baseChannelLogger = getLogger('BaseChannelWrapper');

    private readonly config: RabbitMQ;

    constructor(rabbitMQConfig: RabbitMQ) {
        this.config = rabbitMQConfig;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
    protected async setupConnection(queueName: string, callback: any): Promise<ChannelWrapper> {
        let connected = false;
        const vhost = this.config.vhost ? `/${this.config.vhost}` : '';
        const connectionString = `amqp://${this.config.user}:${this.config.pass}@${this.config.host}:${this.config.port}${vhost}?heartbeat=${this.config.heartbeat}&connection_timeout=${this.config.timeout}`;

        BaseChannelWrapper.baseChannelLogger.debug(`[${queueName}] Setting up queue...`);
        BaseChannelWrapper.baseChannelLogger.debug(connectionString);

        const connection = connect([connectionString]);
        const channelWrapper = connection.createChannel({
            json: true,
            setup: (channel: ConfirmChannel) => {
                return Promise.all([
                    channel.assertQueue(queueName, {durable: true}),
                    channel.bindQueue(queueName, this.config.exchange, 'create'),
                    // eslint-disable-next-line @typescript-eslint/unbound-method
                    channel.consume(queueName, callback),
                ]);
            },
        });

        channelWrapper.on('connect', () => {
            BaseChannelWrapper.baseChannelLogger.info(`[${queueName}] connected!`);
            connected = true;
        });

        channelWrapper.on('close', () => {
            BaseChannelWrapper.baseChannelLogger.error(`[${queueName}] closed!`);
        });

        channelWrapper.on('error', (error) => {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string,@typescript-eslint/restrict-template-expressions
            BaseChannelWrapper.baseChannelLogger.error(`[${queueName}] error! ${error}`);
        });

        BaseChannelWrapper.baseChannelLogger.debug(`[${queueName}] Connecting queue...`);

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

        BaseChannelWrapper.baseChannelLogger.info(`[${queueName} connected!`);

        return channelWrapper;
    }

    /* Expected data format example:
    {
      "type": "hello",
      "body": "world"
    }
    */
    protected parseMessage(
        envelope: ConsumeMessage|null,
        queueName: string,
    ): ParsedQueueMessage {
        if (!envelope) {
            throw new ApplicationException(`[${queueName}] Got empty message!`, 'BaseChannelWrapper.parseMessage');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: {type: string, body: any};

        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            data = JSON.parse(envelope.content.toString());
        } catch (e) {
            throw new ApplicationException(`[${queueName}] Unable to JSON parse message! Message: "${envelope.content.toString()}"`, 'BaseChannelWrapper.parseMessage');
        }

        if (!data.type) {
            throw new ApplicationException(`[${queueName}] Missing message body! ${jsonLogOutput(data)}`, 'BaseChannelWrapper.parseMessage');
        }

        if (!data.body) {
            throw new ApplicationException(`[${queueName}] Missing message body! ${jsonLogOutput(data)}`, 'BaseChannelWrapper.parseMessage');
        }

        BaseChannelWrapper.baseChannelLogger.info(`[${queueName}] successfully parsed message! ${jsonLogOutput(data)}`);

        return new ParsedQueueMessage(data.type, data.body);
    }
}
