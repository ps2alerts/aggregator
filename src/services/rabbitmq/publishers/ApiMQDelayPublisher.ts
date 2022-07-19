import {injectable} from 'inversify';
import {getLogger} from '../../../logger';
import ApplicationException from '../../../exceptions/ApplicationException';
import {RabbitMQQueueWrapperInterface} from '../../../interfaces/RabbitMQQueueWrapperInterface';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import {shortAlert} from '../../../ps2alerts-constants/metagameEventType';
import config from '../../../config';
import RabbitMQQueueFactory from '../../../factories/RabbitMQQueueFactory';
import {ApiQueue} from '../queues/ApiQueue';

@injectable()
export default class ApiMQDelayPublisher implements RabbitMQQueueWrapperInterface {
    private static readonly logger = getLogger('ApiMQDelayPublisher');
    private longQueue: ApiQueue;
    private shortQueue: ApiQueue;

    constructor(private readonly queueFactory: RabbitMQQueueFactory) {}

    public async connect(): Promise<void> {
        this.longQueue = this.queueFactory.createApiQueue(
            `${config.rabbitmq.apiDelayQueueName}-91min`,
            91 * 60 * 1000,
            '',
            config.rabbitmq.apiQueueName,
        );

        this.shortQueue = this.queueFactory.createApiQueue(
            `${config.rabbitmq.apiDelayQueueName}-46min`,
            46 * 60 * 1000,
            '',
            config.rabbitmq.apiQueueName,
        );

        await this.longQueue.connect();
        await this.shortQueue.connect();
    }

    public async send(msg: ApiMQGlobalAggregateMessage, duration: number): Promise<boolean | undefined> {
        // Throw if we're attempting to send empty documents
        if (msg.data.docs.length === 0) {
            ApiMQDelayPublisher.logger.error(`Attempted to send 0 documents to the API, pointless! Pattern: ${msg.pattern}`);
            return;
        }

        const queue = duration === shortAlert ? this.shortQueue : this.longQueue;

        try {
            return await queue.send(msg);
        } catch (err) {
            if (err instanceof Error) {
                throw new ApplicationException(`Could not publish message to delay queue! E: ${err.message}`);
            }
        }
    }
}
