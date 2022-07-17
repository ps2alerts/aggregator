/* eslint-disable @typescript-eslint/naming-convention */
import {injectable} from 'inversify';
import {getLogger} from '../../../logger';
import ApplicationException from '../../../exceptions/ApplicationException';
import {RabbitMQQueueWrapperInterface} from '../../../interfaces/RabbitMQQueueWrapperInterface';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import {shortAlert} from '../../../ps2alerts-constants/metagameEventType';
import config from '../../../config';
import RabbitMQQueueFactory from '../../../factories/RabbitMQQueueFactory';
import RabbitMQQueue from '../RabbitMQQueue';

@injectable()
export default class ApiMQDelayPublisher implements RabbitMQQueueWrapperInterface {
    private static readonly logger = getLogger('ApiMQDelayPublisher');
    private longQueue: RabbitMQQueue;
    private shortQueue: RabbitMQQueue;
    private readonly shortQueueName: string;
    private readonly longQueueName: string;

    constructor(private readonly queueFactory: RabbitMQQueueFactory) {
        this.shortQueueName = `${config.rabbitmq.apiDelayQueueName}-46min`;
        this.longQueueName = `${config.rabbitmq.apiDelayQueueName}-91min`;
    }

    public async connect(): Promise<void> {
        this.longQueue = await this.queueFactory.createEventQueue(
            config.rabbitmq.exchange,
            this.longQueueName,
            {
                messageTtl: 5460000, // 91 minutes
                deadLetterExchange: '',
                deadLetterRoutingKey: config.rabbitmq.apiQueueName,
                arguments: {
                    'x-queue-mode': 'lazy',
                },
            });

        this.shortQueue = await this.queueFactory.createEventQueue(
            config.rabbitmq.exchange,
            this.shortQueueName,
            {
                messageTtl: 2760000, // 46 minutes
                deadLetterExchange: '',
                deadLetterRoutingKey: config.rabbitmq.apiQueueName,
                arguments: {
                    'x-queue-mode': 'lazy',
                },
            });
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
