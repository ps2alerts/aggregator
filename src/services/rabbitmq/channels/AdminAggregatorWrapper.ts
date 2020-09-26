import {inject, injectable, multiInject} from 'inversify';
import {BaseChannelWrapper} from './BaseChannelWrapper';
import {ConsumeMessage} from 'amqplib';
import {jsonLogOutput} from '../../../utils/json';
import {getLogger} from '../../../logger';
import {ChannelWrapper} from 'amqp-connection-manager';
import {MessageQueueChannelWrapperInterface} from '../../../interfaces/MessageQueueChannelWrapperInterface';
import ParsedQueueMessage from '../../../data/ParsedQueueMessage';
import {TYPES} from '../../../constants/types';
import {MessageQueueHandlerInterface} from '../../../interfaces/MessageQueueHandlerInterface';
import RabbitMQ from '../../../config/rabbitmq';
import {get} from '../../../utils/env';

@injectable()
export default class AdminAggregatorWrapper extends BaseChannelWrapper implements MessageQueueChannelWrapperInterface {
    private static readonly logger = getLogger('AdminAggregatorWrapper');

    private static channelWrapper: ChannelWrapper;

    private static queueName = '';

    private static mqAdminMessageSubscribers: Array<MessageQueueHandlerInterface<ParsedQueueMessage>>;

    constructor(
    @multiInject(TYPES.mqAdminMessage) mqAdminMessageSubscribers: Array<MessageQueueHandlerInterface<ParsedQueueMessage>>,
        @inject('rabbitMQConfig') rabbitMQConfig: RabbitMQ,
    ) {
        super(rabbitMQConfig);
        AdminAggregatorWrapper.queueName = `adminAggregator-${get('NODE_ENV', 'development')}`;
        AdminAggregatorWrapper.mqAdminMessageSubscribers = mqAdminMessageSubscribers;
    }

    public async subscribe(): Promise<boolean> {
        AdminAggregatorWrapper.logger.info('Subscribing...');
        AdminAggregatorWrapper.channelWrapper = await this.setupConnection(AdminAggregatorWrapper.queueName, this.handleMessage);
        AdminAggregatorWrapper.logger.info('Subscribed!');

        return true;
    }

    private readonly handleMessage = (msg: ConsumeMessage|null): boolean => {
        let message: ParsedQueueMessage;

        if (!msg) {
            AdminAggregatorWrapper.logger.error(`[${AdminAggregatorWrapper.queueName}] Got empty message!`);
            return false;
        }

        try {
            message = super.parseMessage(msg, AdminAggregatorWrapper.queueName);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            AdminAggregatorWrapper.logger.error(`[${AdminAggregatorWrapper.queueName}] Unable to handle message! Probably invalid format. E: ${e.message}`);
            AdminAggregatorWrapper.channelWrapper.ack(msg);
            return false;
        }

        AdminAggregatorWrapper.mqAdminMessageSubscribers.map(
            (handler: MessageQueueHandlerInterface<ParsedQueueMessage>) => void handler.handle(message)
                .catch((e) => {
                    if (e instanceof Error) {
                        AdminAggregatorWrapper.logger.error(`[${AdminAggregatorWrapper.queueName}] Error processing message! E: ${e.message}\r\n${jsonLogOutput(e)}`);
                    } else {
                        AdminAggregatorWrapper.logger.error('UNEXPECTED ERROR processing message!');
                    }
                }),
        );
        AdminAggregatorWrapper.channelWrapper.ack(msg);
        AdminAggregatorWrapper.logger.debug(`Acked message for ${AdminAggregatorWrapper.queueName}`);

        return true;
    };
}