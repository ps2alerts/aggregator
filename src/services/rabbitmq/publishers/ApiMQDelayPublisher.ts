import RabbitMQ from '../../../config/rabbitmq';
import {inject, injectable} from 'inversify';
import {RabbitMQConnectionHandlerFactory} from '../RabbitMQConnectionHandlerFactory';
import {TYPES} from '../../../constants/types';
import {ChannelWrapper} from 'amqp-connection-manager';
import {getLogger} from '../../../logger';
import ApplicationException from '../../../exceptions/ApplicationException';
import {RabbitMQConnectionAwareInterface} from '../../../interfaces/RabbitMQConnectionAwareInterface';
import {jsonLogOutput} from '../../../utils/json';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';

@injectable()
export default class ApiMQDelayPublisher implements RabbitMQConnectionAwareInterface {
    private static readonly logger = getLogger('ApiMQDelayPublisher');
    private readonly config: RabbitMQ;
    private readonly connectionHandlerFactory: RabbitMQConnectionHandlerFactory;
    private channelWrapper: ChannelWrapper;

    constructor(
    @inject('rabbitMQConfig') config: RabbitMQ,
        @inject(TYPES.rabbitMqConnectionHandlerFactory) connectionHandlerFactory: RabbitMQConnectionHandlerFactory,
    ) {
        this.config = config;
        this.connectionHandlerFactory = connectionHandlerFactory;
    }

    public async connect(): Promise<boolean> {
        ApiMQDelayPublisher.logger.info('Connecting to queue...');
        this.channelWrapper = await this.connectionHandlerFactory.setupQueue(
            this.config.apiDelayQueueName,
            null,
            {
                messageTtl: 5700000, // 95 minutes
                deadLetterExchange: '',
                deadLetterRoutingKey: this.config.apiQueueName,
                arguments: {
                    'x-queue-mode': 'lazy',
                },
            });
        ApiMQDelayPublisher.logger.info('Connected!');

        return true;
    }

    public async send(msg: ApiMQGlobalAggregateMessage, expiration: number): Promise<boolean> {
        // Throw if we're attempting to send empty documents
        if (msg.data.docs.length === 0) {
            throw new ApplicationException(`Attempted to send 0 documents to the API, pointless! Pattern: ${msg.pattern}`);
        }

        try {
            ApiMQDelayPublisher.logger.silly(`Sending message to delay queue: ${jsonLogOutput(msg)}`);
            await this.channelWrapper.sendToQueue(
                this.config.apiDelayQueueName,
                msg,
                {
                    persistent: true,
                    expiration: String(expiration),
                });
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Could not publish message to delay queue! E: ${err.message}`);
        }
    }
}
