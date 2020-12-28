import RabbitMQ from '../../../config/rabbitmq';
import {inject, injectable} from 'inversify';
import {RabbitMQConnectionHandlerFactory} from '../RabbitMQConnectionHandlerFactory';
import {TYPES} from '../../../constants/types';
import {ChannelWrapper} from 'amqp-connection-manager';
import {getLogger} from '../../../logger';
import ApiMQMessage from '../../../data/ApiMQMessage';
import ApplicationException from '../../../exceptions/ApplicationException';
import {RabbitMQConnectionAwareInterface} from '../../../interfaces/RabbitMQConnectionAwareInterface';
import {jsonLogOutput} from '../../../utils/json';

@injectable()
export default class ApiMQPublisher implements RabbitMQConnectionAwareInterface {
    private static readonly logger = getLogger('ApiMQPublisher');
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
        ApiMQPublisher.logger.info('Connecting to queue...');
        this.channelWrapper = await this.connectionHandlerFactory.setupQueue(
            this.config.apiQueueName,
            null,
            {
                messageTtl: 10800000,
                arguments: {
                    'x-queue-mode': 'lazy',
                },
            });
        ApiMQPublisher.logger.info('Connected!');

        return true;
    }

    public async send(msg: ApiMQMessage): Promise<boolean> {
        // Throw if we're attempting to send empty documents
        if (msg.data.docs.length === 0) {
            throw new ApplicationException(`Attempted to send 0 documents to the API, pointless! Pattern: ${msg.pattern}`);
        }

        try {
            ApiMQPublisher.logger.silly(`Sending message to queue: ${jsonLogOutput(msg)}`);
            await this.channelWrapper.sendToQueue(
                this.config.apiQueueName,
                msg,
                {persistent: true},
            );
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Could not publish message to API! E: ${err.message}`);
        }
    }
}
