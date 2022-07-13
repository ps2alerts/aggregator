import {ChannelWrapper} from 'amqp-connection-manager';
import ApiMQMessage from '../../data/ApiMQMessage';
import ApiMQGlobalAggregateMessage from '../../data/ApiMQGlobalAggregateMessage';
import ApplicationException from '../../exceptions/ApplicationException';
import {jsonLogOutput} from '../../utils/json';
import ExceptionHandler from '../../handlers/system/ExceptionHandler';
import {getLogger} from '../../logger';

export default class RabbitMQQueue {
    private static readonly logger = getLogger('RabbitMQQueue');
    private isConnected = true;

    constructor(
        private readonly queueName: string,
        private readonly channel: ChannelWrapper,
    ) {}

    public async send(msg: ApiMQMessage | ApiMQGlobalAggregateMessage): Promise<boolean | undefined> {
        if (!this.isConnected) {
            throw new ApplicationException(`[${this.queueName}] attempted to send a message to the queue when it is closed!`);
        }

        if (!msg) {
            throw new ApplicationException(`${this.queueName}] attempting to send a blank message! Pointless!`);
        }

        try {
            RabbitMQQueue.logger.debug(`${this.queueName}] Sending message: ${jsonLogOutput(msg)}`);
            await this.channel.sendToQueue(
                this.queueName,
                msg,
                {persistent: true},
            );
            return true;
        } catch (err) {
            new ExceptionHandler(`${this.queueName}] Unable to send message to queue!`, err, 'RabbitMQQueue');
        }
    }

    public async destroy(): Promise<void> {
        this.channel.removeAllListeners();
        await this.channel.close();
        this.isConnected = false;
        RabbitMQQueue.logger.info(`[${this.queueName}] connection closed!`);
    }
}
