import {AmqpConnectionManager, ChannelWrapper} from 'amqp-connection-manager';
import ApplicationException from '../../../exceptions/ApplicationException';
import {jsonLogOutput} from '../../../utils/json';
import ExceptionHandler from '../../../handlers/system/ExceptionHandler';
import {getLogger} from '../../../logger';
import {CreateChannelOpts} from 'amqp-connection-manager/dist/esm/ChannelWrapper';
import {ConsumeMessage} from 'amqplib';

export abstract class RabbitMQQueue {
    private static readonly logger = getLogger('RabbitMQQueue');
    private isConnected = true;
    private channel: ChannelWrapper;

    protected constructor(
        private readonly connectionManager: AmqpConnectionManager,
        private readonly queueName: string,
    ) {}

    public getChannel(): ChannelWrapper {
        return this.channel;
    }

    private registerListeners(queueName: string, channel: ChannelWrapper): void {
        channel.on('connect', () => {
            RabbitMQQueue.logger.info(`[${queueName}] connected!`);
        });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        channel.on('close', () => {
            RabbitMQQueue.logger.error(`[${queueName}] closed!`);
        });

        channel.on('error', (err) => {
            if (err instanceof Error) {
                RabbitMQQueue.logger.error(`[${queueName}] rabbit error! ${err.message}`);
            }
        });
    }

    private handleRabbitMqException(err: unknown): void {
        if (err instanceof Error) {
            // Annoyingly ampqlib doesn't expose the IllegalOperationError type, so we have to capture it here via string checks
            if (err.message.includes('Channel closed')) {
                RabbitMQQueue.logger.warn(`${this.queueName} Attempted to (n)ack the message when the channel was closed`);
                return;
            }

            RabbitMQQueue.logger.error(`${this.queueName} RabbitMQ error occurred when attempting to (n)ack message! ${err.message}`);
        } else {
            RabbitMQQueue.logger.error(`${this.queueName} Unknown RabbitMQ error occurred!`);
        }
    }

    protected async createChannel(createChannelOptions: CreateChannelOpts): Promise<void> {
        // The channel options are created from each individual queue implementation. This base class
        // exists because they are all different implementations depending on purpose.
        this.channel = this.connectionManager.createChannel(createChannelOptions);

        this.registerListeners(this.queueName, this.channel);

        // Ensure the connection is actually there
        await this.channel.waitForConnect();
    }

    protected async sendMessage(message: unknown): Promise<boolean | undefined> {
        if (!this.isConnected) {
            throw new ApplicationException(`[${this.queueName}] attempted to send a message to the queue when it is closed!`);
        }

        if (!message) {
            throw new ApplicationException(`${this.queueName}] attempting to send a blank message! Pointless!`);
        }

        try {
            RabbitMQQueue.logger.silly(`${this.queueName}] Sending message: ${jsonLogOutput(message)}`);
            await this.channel.sendToQueue(
                this.queueName,
                message,
                {persistent: true},
            );
            return true;
        } catch (err) {
            new ExceptionHandler(`${this.queueName}] Unable to send message to queue!`, err, 'RabbitMQQueue');
        }
    }

    protected async destroyQueue(): Promise<void> {
        this.channel.removeAllListeners();

        await this.channel.deleteQueue(this.queueName); // Delete the queue (this is called by QueueAuthority so there's a delay)

        await this.channel.close(); // Ensures we've not got dangling connections

        RabbitMQQueue.logger.info(`[${this.queueName}] queue destroyed!`);

        this.isConnected = false;
    }

    protected parseRawMessage<T>(msg: ConsumeMessage): T {
        try {
            return JSON.parse(msg.content.toString()) as T;
        } catch (e) {
            throw new ApplicationException(`Unable to JSON parse message! Message: "${msg.content.toString()}"`, 'RabbitMQCensusStreamFactory');
        }
    }

    protected handleMessageConfirm(message: ConsumeMessage, action: 'ack' | 'retry'): void {
        try {
            if (action === 'ack') {
                return this.channel.ack(message);
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            let tries = parseInt(message.properties.headers.tries ?? '0', 10);

            tries++;

            if (tries >= 3) {
                RabbitMQQueue.logger.error(`${this.queueName} Message exceeded too many tries! Dropping!`);
                return this.channel.nack(message, false, false); // Chuck the message
            }

            // Retry
            message.properties.headers.tries = tries;
            return this.channel.nack(message, false, true);
        } catch (err) {
            return this.handleRabbitMqException(err);
        }
    }

    // protected handleMessageDelay(
    //     message: ConsumeMessage,
    //     delay: number,
    //     pattern: string,
    // ): void {
    //     // Grab the delay publisher and re-publish to delay queue, then nack? the message.
    //
    //     try {
    //         // TODO: IMPLEMENT
    //     } catch (err) {
    //         return this.handleRabbitMqException(err);
    //     }
    //
    // }
}