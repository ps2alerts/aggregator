import {injectable, multiInject} from 'inversify';
import {RabbitMQConnectionHandlerFactory} from '../RabbitMQConnectionHandlerFactory';
import {ConsumeMessage} from 'amqplib';
import {jsonLogOutput} from '../../../utils/json';
import {getLogger} from '../../../logger';
import {ChannelWrapper} from 'amqp-connection-manager';
import {RabbitMQConnectionAwareInterface} from '../../../interfaces/RabbitMQConnectionAwareInterface';
import ParsedQueueMessage from '../../../data/ParsedQueueMessage';
import {TYPES} from '../../../constants/types';
import {MessageQueueHandlerInterface} from '../../../interfaces/MessageQueueHandlerInterface';
import ApplicationException from '../../../exceptions/ApplicationException';
import config from '../../../config';
import AggregatorQueueMessage from '../../../data/AggregatorQueueMessage';

@injectable()
export default class AdminAggregatorSubscriber implements RabbitMQConnectionAwareInterface {
    private static readonly logger = getLogger('AdminAggregatorSubscriber');
    private channelWrapper: ChannelWrapper;
    private readonly queueName = `aggregator-admin-${config.app.environment}-${config.census.censusEnvironment}`;
    private readonly adminMessageHandlers: Array<MessageQueueHandlerInterface<ParsedQueueMessage>>;
    private readonly connectionHandlerFactory: RabbitMQConnectionHandlerFactory;

    constructor(
    @multiInject(TYPES.adminMessageHandlers) mqAdminMessageSubscribers: Array<MessageQueueHandlerInterface<ParsedQueueMessage>>,
                                             connectionHandlerFactory: RabbitMQConnectionHandlerFactory,
    ) {
        this.adminMessageHandlers = mqAdminMessageSubscribers;
        this.connectionHandlerFactory = connectionHandlerFactory;
    }

    public async connect(): Promise<boolean> {
        this.channelWrapper = await this.connectionHandlerFactory.setupQueue(this.queueName, this.handleMessage, {prefetch: 5, arguments: null});

        return true;
    }

    private readonly handleMessage = (msg: ConsumeMessage|null): boolean => {
        let message: ParsedQueueMessage;

        if (!msg) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            AdminAggregatorSubscriber.logger.error(`[${this.queueName}] Got empty message!`);
            return false;
        }

        try {
            message = this.parseMessage(msg);
        } catch (err) {
            if (err instanceof Error) {
                AdminAggregatorSubscriber.logger.error(`[${this.queueName}] Unable to handle message! Probably invalid format. E: ${err.message}`);
            }

            this.channelWrapper.ack(msg);
            AdminAggregatorSubscriber.logger.debug(`Acked failed message for ${this.queueName}`);
            return false;
        }

        // For some reason this does **NOT** catch exceptions, so we must ack in every case and not throw any exceptions within.
        this.adminMessageHandlers.map(
            (handler: MessageQueueHandlerInterface<ParsedQueueMessage>) => void handler.handle(message),
        );
        this.channelWrapper.ack(msg);
        AdminAggregatorSubscriber.logger.debug(`Acked message for ${this.queueName}`);

        return true;
    };

    private parseMessage(
        envelope: ConsumeMessage|null,
    ): ParsedQueueMessage {
        if (!envelope) {
            throw new ApplicationException(`[${this.queueName}] Got empty message!`, 'AdminAggregatorSubscriber.parseMessage');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let payload: AggregatorQueueMessage;

        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            payload = JSON.parse(envelope.content.toString());
        } catch (e) {
            throw new ApplicationException(`[${this.queueName}] Unable to JSON parseMig message! Message: "${envelope.content.toString()}"`, 'AdminAggregatorSubscriber.parseMessage');
        }

        if (payload.type === undefined || payload.type.length === 0) {
            throw new ApplicationException(`[${this.queueName}] Missing message body! ${jsonLogOutput(payload)}`, 'AdminAggregatorSubscriber.parseMessage');
        }

        if (payload.data === undefined) {
            throw new ApplicationException(`[${this.queueName}] Missing message body! ${jsonLogOutput(payload)}`, 'AdminAggregatorSubscriber.parseMessage');
        }

        AdminAggregatorSubscriber.logger.info(`[${this.queueName}] successfully parsed message! ${jsonLogOutput(payload)}`);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return new ParsedQueueMessage(payload.type, payload.data);
    }
}
