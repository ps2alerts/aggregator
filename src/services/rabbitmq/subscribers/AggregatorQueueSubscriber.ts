/* eslint-disable @typescript-eslint/naming-convention */
// noinspection JSMethodCanBeStatic

import {injectable} from 'inversify';
import {RabbitMQConnectionHandlerFactory} from '../RabbitMQConnectionHandlerFactory';
import {ConsumeMessage} from 'amqplib';
import {jsonLogOutput} from '../../../utils/json';
import {getLogger} from '../../../logger';
import {ChannelWrapper} from 'amqp-connection-manager';
import {RabbitMQConnectionAwareInterface} from '../../../interfaces/RabbitMQConnectionAwareInterface';
import ParsedQueueMessage from '../../../data/ParsedQueueMessage';
import ApplicationException from '../../../exceptions/ApplicationException';
import config from '../../../config';
import {ps2alertsAggregatorQueueEvents} from '../../../constants/ps2alertsAggregatorQueueEvents';
import AggregatorQueueMessage from '../../../data/AggregatorQueueMessage';

@injectable()
export default class AggregatorQueueSubscriber implements RabbitMQConnectionAwareInterface {
    private static readonly logger = getLogger('AggregatorQueueSubscriber');
    private channelWrapper: ChannelWrapper;
    private readonly connectionHandlerFactory: RabbitMQConnectionHandlerFactory;

    constructor(connectionHandlerFactory: RabbitMQConnectionHandlerFactory) {
        this.connectionHandlerFactory = connectionHandlerFactory;
    }

    // We call subscribe now rather than in the constructor so we don't have multiple connections open, and it's called as and when it's required
    // from the subscriber itself.
    public async connect(): Promise<boolean> {
        this.channelWrapper = await this.connectionHandlerFactory.setupQueue(config.rabbitmq.aggregatorQueueName, this.handleMessage, {
            arguments: {
                'x-max-priority': 10,
                'x-queue-mode': 'lazy',
            },
        });

        return true;
    }

    private readonly handleMessage = (msg: ConsumeMessage|null): boolean => {
        let message: ParsedQueueMessage;

        if (!msg) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            AggregatorQueueSubscriber.logger.error(`[${config.rabbitmq.aggregatorQueueName}] Got empty message!`);
            return false;
        }

        try {
            message = this.parseMessage(msg, config.rabbitmq.aggregatorQueueName);
        } catch (err) {
            if (err instanceof Error) {
                AggregatorQueueSubscriber.logger.error(`[${config.rabbitmq.aggregatorQueueName}] Unable to handle message! Probably invalid format. E: ${err.message}`);
            }

            this.channelWrapper.ack(msg);
            AggregatorQueueSubscriber.logger.debug(`Acked failed message for ${config.rabbitmq.aggregatorQueueName}`);
            return false;
        }

        AggregatorQueueSubscriber.logger.debug(`Got message via MQ! ${jsonLogOutput(message)}`);

        this.channelWrapper.ack(msg);
        AggregatorQueueSubscriber.logger.debug(`Acked message for ${config.rabbitmq.aggregatorQueueName}`);

        return true;
    };

    private parseMessage(
        envelope: ConsumeMessage | null,
        queueName: string,
    ): ParsedQueueMessage {
        if (!envelope) {
            throw new ApplicationException(`[${queueName}] Got empty message!`, 'AggregatorQueueSubscriber.parseMessage');
        }

        // Set the type for the data
        let payload: AggregatorQueueMessage;

        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            payload = JSON.parse(envelope.content.toString());
        } catch (e) {
            throw new ApplicationException(`[${queueName}] Unable to JSON parse message! Message: "${envelope.content.toString()}"`, 'AggregatorQueueSubscriber.parseMessage');
        }

        if (payload.type === undefined || payload.type.length === 0) {
            throw new ApplicationException(`[${queueName}] Missing message type! ${jsonLogOutput(payload)}`, 'AggregatorQueueSubscriber.parseMessage');
        }

        if (payload.data === undefined) {
            throw new ApplicationException(`[${queueName}] Missing message data! ${jsonLogOutput(payload)}`, 'AggregatorQueueSubscriber.parseMessage');
        }

        if (!Object.values(ps2alertsAggregatorQueueEvents).includes(payload.type)) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`[${queueName}] Unsupported message type was received! Type: ${payload.type}. ${jsonLogOutput(payload)}`, 'AggregatorQueueSubscriber.parseMessage');
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return new ParsedQueueMessage(payload.type, payload.data);
    }
}
