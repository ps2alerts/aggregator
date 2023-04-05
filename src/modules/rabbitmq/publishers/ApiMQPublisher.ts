import {Injectable, Logger} from '@nestjs/common';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {RabbitMQQueueWrapperInterface} from '../../../interfaces/RabbitMQQueueWrapperInterface';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import config from '../../../config';
import RabbitMQQueueFactory from '../factories/RabbitMQQueueFactory';
import ApplicationException from '../../../exceptions/ApplicationException';
import {ApiQueue} from '../queues/ApiQueue';

@Injectable()
export default class ApiMQPublisher implements RabbitMQQueueWrapperInterface {
    private static readonly logger = new Logger('ApiMQPublisher');
    private queue: ApiQueue;

    constructor(private readonly queueFactory: RabbitMQQueueFactory) {}

    public async connect(): Promise<void> {
        this.queue = this.queueFactory.createApiQueue(
            config.rabbitmq.apiQueueName,
            180 * 60 * 1000,
        );

        await this.queue.connect();
    }

    public async send(msg: ApiMQMessage | ApiMQGlobalAggregateMessage): Promise<boolean | undefined> {
        // Throw if we're attempting to send empty documents
        if (msg.data.docs.length === 0) {
            ApiMQPublisher.logger.error(`Attempted to send 0 documents to the API, pointless! Pattern: ${msg.pattern}`);
            return;
        }

        try {
            return await this.queue.send(msg);
        } catch (err) {
            if (err instanceof Error) {
                throw new ApplicationException(`Could not publish message to delay queue! E: ${err.message}`);
            }
        }
    }
}
