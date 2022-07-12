import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {injectable, multiInject} from 'inversify';
import {TYPES} from '../../constants/types';
import {RabbitMQQueueInterface} from '../../interfaces/RabbitMQQueueInterface';
import ApplicationException from '../../exceptions/ApplicationException';

@injectable()
export default class RabbitMQConnectionService implements ServiceInterface {
    public readonly bootPriority = 4;
    private static readonly logger = getLogger('RabbitMQSubscriptionService');
    private readonly messageQueueSubscribers: RabbitMQQueueInterface[];
    private readonly messageQueuePublishers: RabbitMQQueueInterface[];

    constructor(
    @multiInject(TYPES.rabbitMQSubscribers) messageQueueSubscribers: RabbitMQQueueInterface[],
        @multiInject(TYPES.rabbitMQPublishers) messageQueuePublishers: RabbitMQQueueInterface[],
    ) {
        this.messageQueueSubscribers = messageQueueSubscribers;
        this.messageQueuePublishers = messageQueuePublishers;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        RabbitMQConnectionService.logger.debug('Booting RabbitMQSubscriptionService...');

        const connect = (queue: RabbitMQQueueInterface): void => {
            try {
                queue.connect();
            } catch (err) {
                if (err instanceof Error) {
                    throw new ApplicationException(`Error subscribing to RabbitMQ! E: ${err.message}`, 'RabbitMQConnectionService', 1);
                } else {
                    RabbitMQConnectionService.logger.error('UNEXPECTED ERROR subscribing to RabbitMQ!');
                }
            }
        };

        await Promise.all(this.messageQueueSubscribers.map(
            (subscriber: RabbitMQQueueInterface) => connect(subscriber),
        ));

        await Promise.all(this.messageQueuePublishers.map(
            (publisher: RabbitMQQueueInterface) => connect(publisher),
        ));
    }

    // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-empty-function
    public async start(): Promise<void> {}

    // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-empty-function
    public async terminate(): Promise<void> {}
}
