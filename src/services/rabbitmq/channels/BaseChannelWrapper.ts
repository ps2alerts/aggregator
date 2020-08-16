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

    private readonly queueName: string;

    constructor(
        rabbitMQConfig: RabbitMQ,
        queueName: string,
    ) {
        this.config = rabbitMQConfig;
        this.queueName = queueName;
    }

    protected async setupConnection(callback: any): Promise<ChannelWrapper> {
        const connectionString = `amqp://${this.config.user}:${this.config.pass}@${this.config.host}:${this.config.port}`;

        BaseChannelWrapper.baseChannelLogger.debug(`[${this.queueName}] Setting up queue...`);

        // if (this.queuesInitialized.adminWebsocket) {
        //     RabbitMQSubscription.logger.error(`[${this.queueName}] Queue already initialized!`);
        //     return false;
        // }

        BaseChannelWrapper.baseChannelLogger.debug(`amqp://${this.config.user}:${this.config.pass}@${this.config.host}:${this.config.port}`);

        const connection = connect([connectionString]);
        const channelWrapper = connection.createChannel({
            json: true,
            setup: (channel: ConfirmChannel) => {
                return Promise.all([
                    channel.assertQueue(this.config.queues.adminWebsocket.name, {durable: true}),
                    channel.bindQueue(this.config.queues.adminWebsocket.name, this.config.exchange, 'create'),
                    // eslint-disable-next-line @typescript-eslint/unbound-method
                    channel.consume(this.config.queues.adminWebsocket.name, callback),
                ]);
            },
        });

        BaseChannelWrapper.baseChannelLogger.debug(`[${this.queueName}] Connecting queue...`);

        await channelWrapper.waitForConnect();

        BaseChannelWrapper.baseChannelLogger.info(`[${this.queueName}] connected!`);

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

        let data: {type: string, body: string};

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

        return new ParsedQueueMessage(data.type, data.body);
    }
}
