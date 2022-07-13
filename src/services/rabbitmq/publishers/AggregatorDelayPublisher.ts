/* eslint-disable @typescript-eslint/naming-convention */
import {injectable} from 'inversify';
import {getLogger} from '../../../logger';
import {RabbitMQQueueWrapperInterface} from '../../../interfaces/RabbitMQQueueWrapperInterface';
import config from '../../../config';
import RabbitMQQueueFactory from '../../../factories/RabbitMQQueueFactory';
import RabbitMQQueue from '../RabbitMQQueue';

@injectable()
export default class AggregatorDelayPublisher implements RabbitMQQueueWrapperInterface {
    private static readonly logger = getLogger('ApiMQDelayPublisher');
    private queue: RabbitMQQueue;

    constructor(private readonly queueFactory: RabbitMQQueueFactory) {}

    public async connect(): Promise<void> {
        AggregatorDelayPublisher.logger.info('Connecting to queues...');
        this.queue = await this.queueFactory.create(
            config.rabbitmq.exchange,
            'aggregator-retry',
            {
                maxPriority: 2,
                messageTtl: 5 * 60 * 1000,
            },
        );

        AggregatorDelayPublisher.logger.info('Connected!');
    }
    //
    // public async send(msg: ApiMQGlobalAggregateMessage, duration: number): Promise<boolean | undefined> {
    //     // Throw if we're attempting to send empty documents
    //     if (msg.data.docs.length === 0) {
    //         throw new ApplicationException(`Attempted to send 0 documents to the API, pointless! Pattern: ${msg.pattern}`);
    //     }
    //
    //     let wrapper = this.channelWrapperLong;
    //     let queue = this.longQueue;
    //
    //     switch (duration) {
    //         case shortAlert:
    //             wrapper = this.channelWrapperShort;
    //             queue = this.shortQueue;
    //             break;
    //     }
    //
    //     try {
    //         ApiMQDelayPublisher.logger.silly(`Sending message to delay queue: ${jsonLogOutput(msg)}`);
    //         await wrapper.sendToQueue(
    //             queue,
    //             msg,
    //             {
    //                 persistent: true,
    //             });
    //         return true;
    //     } catch (err) {
    //         if (err instanceof Error) {
    //             throw new ApplicationException(`Could not publish message to delay queue! E: ${err.message}`);
    //         }
    //     }
    // }
}
