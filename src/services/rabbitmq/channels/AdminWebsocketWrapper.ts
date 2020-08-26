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

@injectable()
export default class AdminWebsocketWrapper extends BaseChannelWrapper implements MessageQueueChannelWrapperInterface {
    private static readonly logger = getLogger('AdminWebsocketWrapper');

    private static channelWrapper: ChannelWrapper;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private static readonly queueName: string = 'adminWebsocket';

    private static mqAdminMessageSubscribers: Array<MessageQueueHandlerInterface<ParsedQueueMessage>>;

    constructor(
    @multiInject(TYPES.mqAdminMessage) mqAdminMessageSubscribers: Array<MessageQueueHandlerInterface<ParsedQueueMessage>>,
        @inject('rabbitMQConfig') rabbitMQConfig: RabbitMQ,
    ) {
        super(rabbitMQConfig);
        AdminWebsocketWrapper.mqAdminMessageSubscribers = mqAdminMessageSubscribers;
    }

    public async subscribe(): Promise<boolean> {
        AdminWebsocketWrapper.logger.info('Subscribing...');
        AdminWebsocketWrapper.channelWrapper = await this.setupConnection(AdminWebsocketWrapper.queueName, this.handleMessage);
        AdminWebsocketWrapper.logger.info('Subscribed!');

        return true;
    }

    private readonly handleMessage = (msg: ConsumeMessage|null): boolean => {
        let message: ParsedQueueMessage;

        if (!msg) {
            AdminWebsocketWrapper.logger.error(`[${AdminWebsocketWrapper.queueName}] Got empty message!`);
            return false;
        }

        try {
            message = super.parseMessage(msg, AdminWebsocketWrapper.queueName);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            AdminWebsocketWrapper.logger.error(`[${AdminWebsocketWrapper.queueName}] Unable to handle message! Probably invalid format. E: ${e.message}`);
            AdminWebsocketWrapper.channelWrapper.ack(msg);
            return false;
        }

        AdminWebsocketWrapper.mqAdminMessageSubscribers.map(
            (handler: MessageQueueHandlerInterface<ParsedQueueMessage>) => void handler.handle(message)
                .catch((e) => {
                    if (e instanceof Error) {
                        AdminWebsocketWrapper.logger.error(`[${AdminWebsocketWrapper.queueName}] Error processing message! E: ${e.message}\r\n${jsonLogOutput(e)}`);
                    } else {
                        AdminWebsocketWrapper.logger.error('UNEXPECTED ERROR processing message!');
                    }
                }),
        );
        AdminWebsocketWrapper.channelWrapper.ack(msg);
        AdminWebsocketWrapper.logger.debug(`Acked message for ${AdminWebsocketWrapper.queueName}`);

        return true;
    };
}
