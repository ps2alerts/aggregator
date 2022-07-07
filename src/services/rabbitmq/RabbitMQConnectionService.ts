import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {injectable, multiInject} from 'inversify';
import {TYPES} from '../../constants/types';
import {RabbitMQConnectionAwareInterface} from '../../interfaces/RabbitMQConnectionAwareInterface';
import ApplicationException from '../../exceptions/ApplicationException';
import {World} from '../../ps2alerts-constants/world';
import WorldSubscriber from './subscribers/WorldSubscriber';

@injectable()
export default class RabbitMQConnectionService implements ServiceInterface {
    public readonly bootPriority = 4;
    private static readonly logger = getLogger('RabbitMQSubscriptionService');
    private readonly messageQueueSubscribers: RabbitMQConnectionAwareInterface[];
    private readonly messageQueuePublishers: RabbitMQConnectionAwareInterface[];

    constructor(
    @multiInject(TYPES.rabbitMQSubscribers) messageQueueSubscribers: RabbitMQConnectionAwareInterface[],
        @multiInject(TYPES.rabbitMQPublishers) messageQueuePublishers: RabbitMQConnectionAwareInterface[],
                                            private readonly worldSubscriber: WorldSubscriber,
    ) {
        this.messageQueueSubscribers = messageQueueSubscribers;
        this.messageQueuePublishers = messageQueuePublishers;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        RabbitMQConnectionService.logger.debug('Booting RabbitMQSubscriptionService...');

        const connect = async (subscriber: RabbitMQConnectionAwareInterface): Promise<void> => {
            await subscriber.connect() // World here makes zero difference, and I can't seem to remove it from the interface cleanly
                .catch((e) => {
                    if (e instanceof Error) {
                        throw new ApplicationException(`Error subscribing to RabbitMQ! E: ${e.message}`, 'RabbitMQConnectionService', 1);
                    } else {
                        RabbitMQConnectionService.logger.error('UNEXPECTED ERROR subscribing to RabbitMQ!');
                    }
                });
        };

        await Promise.all(this.messageQueueSubscribers.map(
            (subscriber: RabbitMQConnectionAwareInterface) => connect(subscriber),
        ));

        await Promise.all(this.messageQueuePublishers.map(
            (publisher: RabbitMQConnectionAwareInterface) => connect(publisher),
        ));

        await this.worldSubscriber.connect(World.EMERALD);

        // Testing
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        setTimeout(async () => {
            await this.worldSubscriber.disconnect(World.EMERALD);
        }, 10000);
    }

    // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-empty-function
    public async start(): Promise<void> {}

    // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-empty-function
    public async terminate(): Promise<void> {}
}
