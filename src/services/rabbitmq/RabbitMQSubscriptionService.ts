import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {injectable} from 'inversify';
import {RabbitMQSubscription} from './RabbitMQSubscription';

@injectable()
export default class RabbitMQSubscriptionService implements ServiceInterface {
    public readonly bootPriority = 10;

    private static readonly logger = getLogger('MongoDatabaseConnectionService');

    private readonly rabbitMQSubscription: RabbitMQSubscription;

    constructor(rabbitMQSubscription: RabbitMQSubscription) {
        this.rabbitMQSubscription = rabbitMQSubscription;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        RabbitMQSubscriptionService.logger.debug('Booting RabbitMQSubscription Service...');
        await this.rabbitMQSubscription.subscribeAdminWebsocket();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async start(): Promise<void> {
        RabbitMQSubscriptionService.logger.debug('Starting RabbitMQSubscription Service... (NOT IMPLEMENTED)');
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async terminate(): Promise<void> {
        RabbitMQSubscriptionService.logger.warn('Terminating RabbitMQSubscription Service... (NOT IMPLEMENTED)');
        // TODO: Terminate subscription from consuming, drop current messages and mark them as failed
    }
}
