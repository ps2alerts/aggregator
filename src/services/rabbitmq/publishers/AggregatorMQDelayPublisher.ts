/* eslint-disable @typescript-eslint/naming-convention */
import {injectable} from 'inversify';
import {RabbitMQConnectionHandlerFactory} from '../RabbitMQConnectionHandlerFactory';
import {ChannelWrapper} from 'amqp-connection-manager';
import {getLogger} from '../../../logger';
import ApplicationException from '../../../exceptions/ApplicationException';
import {RabbitMQConnectionAwareInterface} from '../../../interfaces/RabbitMQConnectionAwareInterface';
import {jsonLogOutput} from '../../../utils/json';
import config from '../../../config';
import {ps2alertsAggregatorQueueEvents} from '../../../constants/ps2alertsAggregatorQueueEvents';
import AggregatorQueueMessage from '../../../data/AggregatorQueueMessage';

@injectable()
export default class AggregatorMQDelayPublisher implements RabbitMQConnectionAwareInterface {
    private static readonly logger = getLogger('AggregatorMQDelayPublisher');
    private readonly connectionHandlerFactory: RabbitMQConnectionHandlerFactory;
    private channelWrapper: ChannelWrapper;

    constructor(connectionHandlerFactory: RabbitMQConnectionHandlerFactory) {
        this.connectionHandlerFactory = connectionHandlerFactory;
    }

    public async connect(): Promise<boolean> {
        this.channelWrapper = await this.connectionHandlerFactory.setupQueue(
            config.rabbitmq.aggregatorDelayQueueName,
            null,
            {
                messageTtl: 120 * 1000, // For dead letters we have to supply a TTL or nothing happens
                deadLetterExchange: '',
                deadLetterRoutingKey: config.rabbitmq.aggregatorQueueName,
                arguments: {
                    'x-max-priority': 10, // So the priority can pass onto the DL queue
                    'x-queue-mode': 'lazy',
                },
            });

        AggregatorMQDelayPublisher.logger.info('Connected to Aggregator delay queues!');

        const promises = [
            await this.send({type: ps2alertsAggregatorQueueEvents.DEATH, data: 'priority10'}, 10000, 10),
        ];

        await Promise.all(promises).then(() => {
            console.log('Sent test messages');
        });

        return true;
    }

    public async send(message: AggregatorQueueMessage, timeout = 15000, priority = 0): Promise<boolean | undefined> {
        // Throw if we're attempting to send empty documents
        if (!message) {
            throw new ApplicationException('Attempted to send empty message to queue!');
        }

        if (priority < 0 || priority > 10) {
            throw new ApplicationException('Priority range incorrect. It must be between 0-10.');
        }

        try {
            AggregatorMQDelayPublisher.logger.debug(`Sending message to Aggregator delay queue: ${jsonLogOutput(message)}`);
            await this.channelWrapper.sendToQueue(
                config.rabbitmq.aggregatorDelayQueueName,
                message, // Don't JSON.stringify here, it's done for us
                {
                    persistent: true,
                    expiration: timeout,
                    priority, // Higher number = higher priority
                });
            return true;
        } catch (err) {
            if (err instanceof Error) {
                throw new ApplicationException(`Could not publish message to Aggregator delay queue! E: ${err.message}`);
            }
        }
    }
}
