/* eslint-disable @typescript-eslint/naming-convention */
import {injectable} from 'inversify';
import {ChannelWrapper} from 'amqp-connection-manager';
import {getLogger} from '../../../logger';
import ApplicationException from '../../../exceptions/ApplicationException';
import {RabbitMQSubscriberInterface} from '../../../interfaces/RabbitMQSubscriberInterface';
import {jsonLogOutput} from '../../../utils/json';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import {shortAlert} from '../../../ps2alerts-constants/metagameEventType';
import config from '../../../config';
import RabbitMQChannelFactory from '../../../factories/RabbitMQChannelFactory';

@injectable()
export default class ApiMQDelayPublisher implements RabbitMQSubscriberInterface {
    private static readonly logger = getLogger('ApiMQDelayPublisher');
    private channelWrapperLong: ChannelWrapper;
    private channelWrapperShort: ChannelWrapper;
    private readonly shortQueueName: string;
    private readonly longQueueName: string;

    constructor(
        private readonly channelFactory: RabbitMQChannelFactory,
    ) {
        this.shortQueueName = `${config.rabbitmq.apiDelayQueueName}-46min`;
        this.longQueueName = `${config.rabbitmq.apiDelayQueueName}-91min`;
    }

    public connect(): void{
        this.channelWrapperLong = this.channelFactory.create(
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

        this.channelWrapperShort = this.channelFactory.create(
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
            throw new ApplicationException(`Attempted to send 0 documents to the API, pointless! Pattern: ${msg.pattern}`);
        }

        let wrapper = this.channelWrapperLong;
        let queue = this.longQueueName;

        switch (duration) {
            case shortAlert:
                wrapper = this.channelWrapperShort;
                queue = this.shortQueueName;
                break;
        }

        try {
            ApiMQDelayPublisher.logger.debug(`Sending message to delay queue: ${jsonLogOutput(msg)}`);
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
