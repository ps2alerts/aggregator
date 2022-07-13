import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {injectable} from 'inversify';
import MetagameSubscriber from './subscribers/MetagameSubscriber';
import AdminAggregatorSubscriber from './subscribers/AdminAggregatorSubscriber';
import ApiMQPublisher from './publishers/ApiMQPublisher';
import ApiMQDelayPublisher from './publishers/ApiMQDelayPublisher';

@injectable()
export default class RabbitMQConnectionService implements ServiceInterface {
    public readonly bootPriority = 4;
    private static readonly logger = getLogger('RabbitMQSubscriptionService');

    constructor(
        private readonly apiMqPublisher: ApiMQPublisher,
        private readonly apiMqDelayPublisher: ApiMQDelayPublisher,
        private readonly metagameSubscriber: MetagameSubscriber,
        private readonly adminAggregatorSubscriber: AdminAggregatorSubscriber,
    ) {}

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        RabbitMQConnectionService.logger.debug('Booting RabbitMQSubscriptionService...');
        await this.apiMqPublisher.connect();
        await this.apiMqDelayPublisher.connect();
    }

    // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-empty-function
    public async start(): Promise<void> {
        RabbitMQConnectionService.logger.debug('Starting RabbitMQSubscriptionService...');
        await this.metagameSubscriber.connect();
        await this.adminAggregatorSubscriber.connect();
    }

    // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-empty-function
    public async terminate(): Promise<void> {}
}
