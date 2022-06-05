/* eslint-disable @typescript-eslint/naming-convention */
import {injectable} from 'inversify';
import {RabbitMQConnectionHandlerFactory} from '../RabbitMQConnectionHandlerFactory';
import {ChannelWrapper} from 'amqp-connection-manager';
import {getLogger} from '../../../logger';
import ApiMQMessage from '../../../data/ApiMQMessage';
import ApplicationException from '../../../exceptions/ApplicationException';
import {RabbitMQConnectionAwareInterface} from '../../../interfaces/RabbitMQConnectionAwareInterface';
import {jsonLogOutput} from '../../../utils/json';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import config from '../../../config';

@injectable()
export default class ApiMQPublisher implements RabbitMQConnectionAwareInterface {
    private static readonly logger = getLogger('ApiMQPublisher');
    private readonly connectionHandlerFactory: RabbitMQConnectionHandlerFactory;
    private channelWrapper: ChannelWrapper;

    constructor(connectionHandlerFactory: RabbitMQConnectionHandlerFactory) {
        this.connectionHandlerFactory = connectionHandlerFactory;
    }

    public async connect(): Promise<boolean> {
        this.channelWrapper = await this.connectionHandlerFactory.setupQueue(
            config.rabbitmq.apiQueueName,
            null,
            {
                messageTtl: (180 * 60) * 1000,
            });
        ApiMQPublisher.logger.info('Connected!');

        return true;
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
