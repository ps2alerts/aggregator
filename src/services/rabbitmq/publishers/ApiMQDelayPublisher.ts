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
import {shortAlert} from '../../../constants/metagameEventType';

@injectable()
export default class ApiMQDelayPublisher implements RabbitMQConnectionAwareInterface {
    private static readonly logger = getLogger('ApiMQDelayPublisher');
    private readonly config: RabbitMQ;
    private readonly connectionHandlerFactory: RabbitMQConnectionHandlerFactory;
    private channelWrapperLong: ChannelWrapper;
    private channelWrapperShort: ChannelWrapper;
    private readonly shortQueue: string;
    private readonly longQueue: string;

    constructor(
    @inject('rabbitMQConfig') config: RabbitMQ,
        @inject(TYPES.rabbitMqConnectionHandlerFactory) connectionHandlerFactory: RabbitMQConnectionHandlerFactory,
    ) {
        this.config = config;
        this.connectionHandlerFactory = connectionHandlerFactory;
        this.shortQueue = `${this.config.apiDelayQueueName}-46min`;
        this.longQueue = `${this.config.apiDelayQueueName}-91min`;
    }

    public async connect(): Promise<boolean> {
        ApiMQDelayPublisher.logger.info('Connecting to queues...');
        this.channelWrapperLong = await this.connectionHandlerFactory.setupQueue(
            this.longQueue,
            null,
            {
                messageTtl: 5460000, // 91 minutes
                deadLetterExchange: '',
                deadLetterRoutingKey: this.config.apiQueueName,
                arguments: {
                    'x-queue-mode': 'lazy',
                },
            });

        this.channelWrapperShort = await this.connectionHandlerFactory.setupQueue(
            this.shortQueue,
            null,
            {
                messageTtl: 2760000, // 46 minutes
                deadLetterExchange: '',
                deadLetterRoutingKey: this.config.apiQueueName,
                arguments: {
                    'x-queue-mode': 'lazy',
                },
            });

        ApiMQDelayPublisher.logger.info('Connected!');

        return true;
    }

    public async send(msg: ApiMQGlobalAggregateMessage, duration: number): Promise<boolean> {
        // Throw if we're attempting to send empty documents
        if (msg.data.docs.length === 0) {
            throw new ApplicationException(`Attempted to send 0 documents to the API, pointless! Pattern: ${msg.pattern}`);
        }

        let wrapper = this.channelWrapperLong;
        let queue = this.longQueue;

        switch (duration) {
            case shortAlert:
                wrapper = this.channelWrapperShort;
                queue = this.shortQueue;
                break;
        }

        try {
            ApiMQDelayPublisher.logger.silly(`Sending message to delay queue: ${jsonLogOutput(msg)}`);
            await wrapper.sendToQueue(
                queue,
                msg,
                {
                    persistent: true,
                });
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Could not publish message to delay queue! E: ${err.message}`);
        }
    }
}
