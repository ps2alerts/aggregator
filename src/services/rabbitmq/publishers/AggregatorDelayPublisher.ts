/* eslint-disable @typescript-eslint/naming-convention */
import {injectable} from 'inversify';
import {ChannelWrapper} from 'amqp-connection-manager';
import {getLogger} from '../../../logger';
import {RabbitMQQueueInterface} from '../../../interfaces/RabbitMQQueueInterface';
import config from '../../../config';
import RabbitMQChannelFactory from '../../../factories/RabbitMQChannelFactory';

@injectable()
export default class AggregatorDelayPublisher implements RabbitMQQueueInterface {
    private static readonly logger = getLogger('ApiMQDelayPublisher');
    private channelWrapper: ChannelWrapper;

    constructor(
        private readonly channelFactory: RabbitMQChannelFactory,
    ) {}

    public connect(): void {
        AggregatorDelayPublisher.logger.info('Connecting to queues...');
        this.channelWrapper = this.channelFactory.create(
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
