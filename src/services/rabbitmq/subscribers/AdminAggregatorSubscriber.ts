import {inject, injectable, multiInject} from 'inversify';
import {RabbitMQConnectionHandlerFactory} from '../RabbitMQConnectionHandlerFactory';
import {ConsumeMessage} from 'amqplib';
import {jsonLogOutput} from '../../../utils/json';
import {getLogger} from '../../../logger';
import {ChannelWrapper} from 'amqp-connection-manager';
import {RabbitMQConnectionAwareInterface} from '../../../interfaces/RabbitMQConnectionAwareInterface';
import ParsedQueueMessage from '../../../data/ParsedQueueMessage';
import {TYPES} from '../../../constants/types';
import {MessageQueueHandlerInterface} from '../../../interfaces/MessageQueueHandlerInterface';
import RabbitMQ from '../../../config/rabbitmq';
import {get} from '../../../utils/env';
import ApplicationException from '../../../exceptions/ApplicationException';

@injectable()
export default class AdminAggregatorSubscriber implements RabbitMQConnectionAwareInterface {
    private static readonly logger = getLogger('AdminAggregatorSubscriber');
    private static channelWrapper: ChannelWrapper;
    private static queueName = '';
    private static adminMessageHandlers: Array<MessageQueueHandlerInterface<ParsedQueueMessage>>;
    private readonly connectionHandlerFactory: RabbitMQConnectionHandlerFactory;

    constructor(
    @multiInject(TYPES.adminMessageHandlers) mqAdminMessageSubscribers: Array<MessageQueueHandlerInterface<ParsedQueueMessage>>,
        @inject('rabbitMQConfig') rabbitMQConfig: RabbitMQ,
        @inject(TYPES.rabbitMqConnectionHandlerFactory) connectionHandlerFactory: RabbitMQConnectionHandlerFactory,
    ) {
        AdminAggregatorSubscriber.queueName = `adminAggregator-${get('NODE_ENV', 'development')}`;
        AdminAggregatorSubscriber.adminMessageHandlers = mqAdminMessageSubscribers;
        this.connectionHandlerFactory = connectionHandlerFactory;
    }

    // We call subscribe now rather than in the constructor so we don't have multiple connections open, and it's called as and when it's required
    // from the subscriber itself.
    public async connect(): Promise<boolean> {
        AdminAggregatorSubscriber.logger.info('Subscribing...');
        AdminAggregatorSubscriber.channelWrapper = await this.connectionHandlerFactory.setupQueue(AdminAggregatorSubscriber.queueName, this.handleMessage);
        AdminAggregatorSubscriber.logger.info('Subscribed!');

        return true;
    }

    private static parseMessage(
        envelope: ConsumeMessage|null,
        queueName: string,
    ): ParsedQueueMessage {
        if (!envelope) {
            throw new ApplicationException(`[${queueName}] Got empty message!`, 'RabbitMQConnectionHandlerFactory.parseMessage');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: {type: string, body: any};

        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            data = JSON.parse(envelope.content.toString());
        } catch (e) {
            throw new ApplicationException(`[${queueName}] Unable to JSON parse message! Message: "${envelope.content.toString()}"`, 'RabbitMQConnectionHandlerFactory.parseMessage');
        }

        if (!data.type) {
            throw new ApplicationException(`[${queueName}] Missing message body! ${jsonLogOutput(data)}`, 'RabbitMQConnectionHandlerFactory.parseMessage');
        }

        if (!data.body) {
            throw new ApplicationException(`[${queueName}] Missing message body! ${jsonLogOutput(data)}`, 'RabbitMQConnectionHandlerFactory.parseMessage');
        }

        AdminAggregatorSubscriber.logger.info(`[${queueName}] successfully parsed message! ${jsonLogOutput(data)}`);

        return new ParsedQueueMessage(data.type, data.body);
    }

    private readonly handleMessage = (msg: ConsumeMessage|null): boolean => {
        let message: ParsedQueueMessage;

        if (!msg) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            AdminAggregatorSubscriber.logger.error(`[${AdminAggregatorSubscriber.queueName}] Got empty message!`);
            return false;
        }

        try {
            message = AdminAggregatorSubscriber.parseMessage(msg, AdminAggregatorSubscriber.queueName);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            AdminAggregatorSubscriber.logger.error(`[${AdminAggregatorSubscriber.queueName}] Unable to handle message! Probably invalid format. E: ${e.message}`);
            AdminAggregatorSubscriber.channelWrapper.ack(msg);
            return false;
        }

        AdminAggregatorSubscriber.adminMessageHandlers.map(
            (handler: MessageQueueHandlerInterface<ParsedQueueMessage>) => void handler.handle(message)
                .catch((e) => {
                    if (e instanceof Error) {
                        AdminAggregatorSubscriber.logger.error(`[${AdminAggregatorSubscriber.queueName}] Error processing message! E: ${e.message}\r\n${jsonLogOutput(e)}`);
                    } else {
                        AdminAggregatorSubscriber.logger.error('UNEXPECTED ERROR processing message!');
                    }
                }),
        );
        AdminAggregatorSubscriber.channelWrapper.ack(msg);
        AdminAggregatorSubscriber.logger.debug(`Acked message for ${AdminAggregatorSubscriber.queueName}`);

        return true;
    };
}
