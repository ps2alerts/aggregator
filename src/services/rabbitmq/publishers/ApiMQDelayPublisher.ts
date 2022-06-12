/* eslint-disable @typescript-eslint/naming-convention */
import {RabbitMQConnectionHandlerFactory} from '../RabbitMQConnectionHandlerFactory';
import {ChannelWrapper} from 'amqp-connection-manager';
import {getLogger} from '../../../logger';
import ApplicationException from '../../../exceptions/ApplicationException';
import {RabbitMQConnectionAwareInterface} from '../../../interfaces/RabbitMQConnectionAwareInterface';
import {jsonLogOutput} from '../../../utils/json';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import {shortAlert} from '../../../constants/metagameEventType';
import {injectable} from 'inversify';
import config from '../../../config';

@injectable()
export default class ApiMQDelayPublisher implements RabbitMQConnectionAwareInterface {
    private static readonly logger = getLogger('ApiMQDelayPublisher');
    private readonly connectionHandlerFactory: RabbitMQConnectionHandlerFactory;
    private channelWrapperLong: ChannelWrapper;
    private channelWrapperShort: ChannelWrapper;
    private readonly shortQueue: string;
    private readonly longQueue: string;

    constructor(connectionHandlerFactory: RabbitMQConnectionHandlerFactory) {
        this.connectionHandlerFactory = connectionHandlerFactory;
        this.shortQueue = `${config.rabbitmq.apiDelayQueueName}-46min`;
        this.longQueue = `${config.rabbitmq.apiDelayQueueName}-91min`;
    }

    public async connect(): Promise<boolean> {
        this.channelWrapperLong = await this.connectionHandlerFactory.setupQueue(
            this.longQueue,
            null,
            {
                messageTtl: (91 * 60) * 1000, // 91 minutes in milliseconds
                deadLetterExchange: '',
                deadLetterRoutingKey: config.rabbitmq.apiQueueName,
            });

        this.channelWrapperShort = await this.connectionHandlerFactory.setupQueue(
            this.shortQueue,
            null,
            {
                messageTtl: (46 * 60) * 1000,
                deadLetterExchange: '',
                deadLetterRoutingKey: config.rabbitmq.apiQueueName,
            });

        ApiMQDelayPublisher.logger.info('Connected to all queues!');

        return true;
    }

    public async send(msg: ApiMQGlobalAggregateMessage, duration: number): Promise<boolean | undefined> {
        // Throw if we're attempting to send empty documents
        if (msg.data.docs.length === 0) {
            throw new ApplicationException(`Attempted to send 0 documents to the API, pointless! Pattern: ${msg.pattern}`);
        }

        const wrapper = duration === shortAlert ? this.channelWrapperShort : this.channelWrapperLong;
        const queue = duration === shortAlert ? this.shortQueue : this.longQueue;

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
            if (err instanceof Error) {
                throw new ApplicationException(`Could not publish message to delay queue! E: ${err.message}`);
            }
        }
    }
}
