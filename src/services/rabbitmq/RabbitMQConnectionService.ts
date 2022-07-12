import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {injectable, multiInject} from 'inversify';
import {TYPES} from '../../constants/types';
import {RabbitMQQueueInterface} from '../../interfaces/RabbitMQQueueInterface';

@injectable()
export default class RabbitMQConnectionService implements ServiceInterface {
    public readonly bootPriority = 4;
    private static readonly logger = getLogger('RabbitMQSubscriptionService');
    private readonly messageQueueSubscribers: RabbitMQQueueInterface[];
    // private readonly messageQueuePublishers: RabbitMQQueueInterface[];

    constructor(
    @multiInject(TYPES.rabbitMQSubscribers) messageQueueSubscribers: RabbitMQQueueInterface[],
        // @multiInject(TYPES.rabbitMQPublishers) messageQueuePublishers: RabbitMQQueueInterface[],
    ) {
        this.messageQueueSubscribers = messageQueueSubscribers;
        // this.messageQueuePublishers = messageQueuePublishers;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        RabbitMQConnectionService.logger.debug('Booting RabbitMQSubscriptionService...');

        await Promise.all(this.messageQueueSubscribers.map(
            async (subscriber: RabbitMQQueueInterface) => await subscriber.connect(),
        ));

        // Annoyingly the publishers cannot be connected this way, there's some wonky logic going on with inversify.
        // For now they're manually defined in ./index.ts
        // await Promise.all(this.messageQueuePublishers.map(
        //     async (publisher: RabbitMQQueueInterface) => await publisher.connect(),
        // ));
    }

    // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-empty-function
    public async start(): Promise<void> {}

    // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-empty-function
    public async terminate(): Promise<void> {}
}
