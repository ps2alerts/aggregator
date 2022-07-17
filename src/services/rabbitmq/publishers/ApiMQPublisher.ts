/* eslint-disable @typescript-eslint/naming-convention */
import {injectable} from 'inversify';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {RabbitMQQueueWrapperInterface} from '../../../interfaces/RabbitMQQueueWrapperInterface';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import config from '../../../config';
import RabbitMQQueueFactory from '../../../factories/RabbitMQQueueFactory';
import RabbitMQQueue from '../RabbitMQQueue';
import ApplicationException from '../../../exceptions/ApplicationException';
import {getLogger} from '../../../logger';

@injectable()
export default class ApiMQPublisher implements RabbitMQQueueWrapperInterface {
    private static readonly logger = getLogger('ApiMQPublisher');
    private queue: RabbitMQQueue;

    constructor(private readonly queueFactory: RabbitMQQueueFactory) {}

    public async connect(): Promise<void> {
        this.queue = await this.queueFactory.createEventQueue(
            config.rabbitmq.exchange,
            config.rabbitmq.apiQueueName,
            {
                messageTtl: 180 * 60 * 1000,
                arguments: {
                    'x-queue-mode': 'lazy',
                },
            },
        );
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
