import {inject, injectable} from 'inversify';
import {getLogger} from '../../logger';
import RabbitMQ from '../../config/rabbitmq';
import {ChannelWrapper, connect} from 'amqp-connection-manager';
import {ConfirmChannel, ConsumeMessage} from 'amqplib';
import {jsonLogOutput} from '../../utils/json';

@injectable()
export class RabbitMQSubscription {
    private static readonly logger = getLogger('RabbitMQSubscription');

    private static channelWrapper: ChannelWrapper;

    private readonly config: RabbitMQ;

    private readonly queuesInitialized = {
        adminWebsocket: false,
    };

    private readonly connectionString: string;

    constructor(@inject('rabbitMQConfig') rabbitMQConfig: RabbitMQ) {
        this.config = rabbitMQConfig;
        this.connectionString = `amqp://${this.config.user}:${this.config.pass}@${this.config.host}:${this.config.port}`;
    }

    public async subscribeAdminWebsocket(): Promise<boolean> {
        RabbitMQSubscription.logger.info(`Subscribing queue "${this.config.queues.adminWebsocket.name}"...`);

        if (this.queuesInitialized.adminWebsocket) {
            RabbitMQSubscription.logger.error(`Queue ${this.config.queues.adminWebsocket.name} already initialized!`);
            return false;
        }

        RabbitMQSubscription.logger.debug(`amqp://${this.config.user}:${this.config.pass}@${this.config.host}:${this.config.port}`);

        const connection = connect([this.connectionString]);
        RabbitMQSubscription.channelWrapper = connection.createChannel({
            json: true,
            setup: (channel: ConfirmChannel) => {
                // `channel` here is a regular amqplib `ConfirmChannel`.
                // Note that `this` here is the channelWrapper instance.
                return Promise.all([
                    channel.assertQueue(this.config.queues.adminWebsocket.name, {durable: true}),
                    channel.bindQueue(this.config.queues.adminWebsocket.name, this.config.exchange, 'create'),
                    // eslint-disable-next-line @typescript-eslint/unbound-method
                    channel.consume(this.config.queues.adminWebsocket.name, RabbitMQSubscription.handleWebsocketAdminMessage),
                ]);
            },
        });

        RabbitMQSubscription.logger.debug(`Setting up queue ${this.config.queues.adminWebsocket.name}...`);

        await RabbitMQSubscription.channelWrapper.waitForConnect();

        return true;
    }

    private static readonly handleWebsocketAdminMessage = function(msg: ConsumeMessage|null): boolean {
        const queueName = 'adminWebsocket';

        if (!msg) {
            RabbitMQSubscription.logger.error('Got empty message!');
            return false;
        }

        let data = '';
        RabbitMQSubscription.logger.debug(`Got message for ${queueName}!`);

        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            data = JSON.parse(msg.content.toString());
        } catch (e) {
            RabbitMQSubscription.logger.error(`Unable to parse message in queue ${queueName}`);
            RabbitMQSubscription.logger.error(data);
            RabbitMQSubscription.channelWrapper.ack(msg);
            return false;
        }

        RabbitMQSubscription.logger.info(jsonLogOutput(data));
        // TODO: Handle message
        RabbitMQSubscription.channelWrapper.ack(msg);
        RabbitMQSubscription.logger.debug(`Acked message for ${queueName}`);

        return true;
    };
}
