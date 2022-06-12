/* eslint-disable @typescript-eslint/naming-convention */
import {injectable} from 'inversify';
import {RabbitMQConnectionHandlerFactory} from '../RabbitMQConnectionHandlerFactory';
import {ChannelWrapper} from 'amqp-connection-manager';
import {getLogger} from '../../../logger';
import ApplicationException from '../../../exceptions/ApplicationException';
import {RabbitMQConnectionAwareInterface} from '../../../interfaces/RabbitMQConnectionAwareInterface';
import {jsonLogOutput} from '../../../utils/json';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import config from '../../../config';
import {ps2alertsAggregatorQueueEvents} from '../../../constants/ps2alertsAggregatorQueueEvents';

@injectable()
export default class AggregatorMQPublisher implements RabbitMQConnectionAwareInterface {
    private static readonly logger = getLogger('AggregatorMQPublisher');
    private readonly connectionHandlerFactory: RabbitMQConnectionHandlerFactory;
    private channelWrapper: ChannelWrapper;

    constructor(connectionHandlerFactory: RabbitMQConnectionHandlerFactory) {
        this.connectionHandlerFactory = connectionHandlerFactory;
    }

    public async connect(): Promise<boolean> {
        this.channelWrapper = await this.connectionHandlerFactory.setupQueue(config.rabbitmq.aggregatorQueueName, null, {
            arguments: {
                'x-max-priority': 10,
                'x-queue-mode': 'lazy',
            },
        });

        AggregatorMQPublisher.logger.info('Connected to Aggregator queue successfully!');

        return true;
    }

    public async send(msg: ApiMQGlobalAggregateMessage, type = ps2alertsAggregatorQueueEvents, priority = false): Promise<boolean | undefined> {
        try {
            AggregatorMQPublisher.logger.silly(`Sending message to delay queue: ${jsonLogOutput(msg)}`);
            await this.channelWrapper.sendToQueue(
                config.rabbitmq.aggregatorQueueName,
                {
                    type,
                    msg,
                },
                {
                    persistent: true,
                    priority: priority ? 10 : 0, // Higher number = higher priority
                });
            return true;
        } catch (err) {
            if (err instanceof Error) {
                throw new ApplicationException(`Could not publish message to Aggregator queue! E: ${err.message}`);
            }
        }
    }
}
