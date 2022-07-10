/* eslint-disable @typescript-eslint/naming-convention */
import {injectable} from 'inversify';
import {ChannelWrapper} from 'amqp-connection-manager';
import {getLogger} from '../../../logger';
import ApiMQMessage from '../../../data/ApiMQMessage';
import ApplicationException from '../../../exceptions/ApplicationException';
import {RabbitMQSubscriberInterface} from '../../../interfaces/RabbitMQSubscriberInterface';
import {jsonLogOutput} from '../../../utils/json';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import config from '../../../config';
import RabbitMQChannelFactory from '../../../factories/RabbitMQChannelFactory';

@injectable()
export default class ApiMQPublisher implements RabbitMQSubscriberInterface {
    private static readonly logger = getLogger('ApiMQPublisher');
    private channelWrapper: ChannelWrapper;

    constructor(
        private readonly channelFactory: RabbitMQChannelFactory,
    ) {}

    public connect(): void {
        this.channelWrapper = this.channelFactory.create(
            config.rabbitmq.exchange,
            config.rabbitmq.apiQueueName,
            {
                messageTtl: 10800000,
                arguments: {
                    'x-queue-mode': 'lazy',
                },
            });
    }

    public async send(msg: ApiMQMessage | ApiMQGlobalAggregateMessage): Promise<boolean | undefined> {
        // Throw if we're attempting to send empty documents
        if (msg.data.docs.length === 0) {
            throw new ApplicationException(`Attempted to send 0 documents to the API, pointless! Pattern: ${msg.pattern}`);
        }

        try {
            ApiMQPublisher.logger.silly(`Sending message to queue: ${jsonLogOutput(msg)}`);
            await this.channelWrapper.sendToQueue(
                config.rabbitmq.apiQueueName,
                msg,
                {persistent: true},
            );
            return true;
        } catch (err) {
            if (err instanceof Error) {
                throw new ApplicationException(`Could not publish message to API! E: ${err.message}`);
            }
        }
    }
}
