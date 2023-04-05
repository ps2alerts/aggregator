import {Injectable, Logger} from '@nestjs/common';
import ApplicationException from '../../../exceptions/ApplicationException';
import {RabbitMQQueueWrapperInterface} from '../../../interfaces/RabbitMQQueueWrapperInterface';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import {shortAlert} from '../../../ps2alerts-constants/metagameEventType';
import RabbitMQQueueFactory from '../factories/RabbitMQQueueFactory';
import {ApiQueue} from '../queues/ApiQueue';
import {ConfigService} from "@nestjs/config";

@Injectable()
export default class ApiMQDelayPublisher implements RabbitMQQueueWrapperInterface {
    private static readonly logger = new Logger('ApiMQDelayPublisher');
    private longQueue: ApiQueue;
    private shortQueue: ApiQueue;

    private readonly apiDelayQueueName: string;
    private readonly apiQueueName: string;

    constructor(private readonly queueFactory: RabbitMQQueueFactory, config: ConfigService) {
        this.apiDelayQueueName = config.get('rabbitmq.apiDelayQueueName');
        this.apiQueueName = config.get('rabbitmq.apiQueueName');
    }

    public async connect(): Promise<void> {
        this.longQueue = this.queueFactory.createApiQueue(
            `${this.apiDelayQueueName}-91min`,
            91 * 60 * 1000,
            '',
            this.apiQueueName,
        );

        this.shortQueue = this.queueFactory.createApiQueue(
            `${this.apiDelayQueueName}-46min`,
            46 * 60 * 1000,
            '',
            this.apiQueueName,
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
