import {inject, injectable} from 'inversify';
import {getLogger} from '../../logger';
import RabbitMQ from '../../config/rabbitmq';
import * as Amqp from 'amqp-ts';
import {Message} from 'amqp-ts';

@injectable()
export class RabbitMQSubscription {
    private static readonly logger = getLogger('RabbitMQSubscription');

    private readonly config: RabbitMQ;

    private readonly queuesInitialized = {
        adminWebsocket: false,
    };

    constructor(@inject('rabbitMQConfig') rabbitMQConfig: RabbitMQ) {
        this.config = rabbitMQConfig;
    }

    public async subscribeAdminWebsocket(): Promise<boolean> {
        RabbitMQSubscription.logger.info(`Subscribing ${this.config.queues.adminWebsocket.name}`);

        if (this.queuesInitialized.adminWebsocket) {
            RabbitMQSubscription.logger.error(`Queue ${this.config.queues.adminWebsocket.name} already initialized!`);
            return false;
        }

        RabbitMQSubscription.logger.debug(`amqp://${this.config.host}`);

        const connection = new Amqp.Connection(`amqp://${this.config.host}`);
        const exchange = connection.declareExchange(this.config.exchange);
        const queue = connection.declareQueue(this.config.queues.adminWebsocket.name);

        RabbitMQSubscription.logger.debug(`Queue ${this.config.queues.adminWebsocket.name} binding...`);

        void queue.bind(exchange);

        RabbitMQSubscription.logger.debug(`Queue ${this.config.queues.adminWebsocket.name} bound!`);

        void queue.activateConsumer((message: Message) => {
            RabbitMQSubscription.logger.info(`${this.config.queues.adminWebsocket.name} message received: ${message.getContent()}`);
        });

        await connection.completeConfiguration().then(() => {
            RabbitMQSubscription.logger.info(`${this.config.queues.adminWebsocket.name} subscribed!`);
            this.queuesInitialized.adminWebsocket = true;
        });

        return true;
    }
}
