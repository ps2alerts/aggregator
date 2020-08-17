import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {injectable, multiInject} from 'inversify';
import {TYPES} from '../../constants/types';
import {MessageQueueChannelWrapperInterface} from '../../interfaces/MessageQueueChannelWrapperInterface';
import ApplicationException from '../../exceptions/ApplicationException';

@injectable()
export default class RabbitMQSubscriptionService implements ServiceInterface {
    public readonly bootPriority = 10;

    private static readonly logger = getLogger('RabbitMQSubscriptionService');

    private readonly messageQueueSubscribers: MessageQueueChannelWrapperInterface[];

    constructor(@multiInject(TYPES.messageQueueSubscribers) messageQueueSubscribers: MessageQueueChannelWrapperInterface[],
    ) {
        this.messageQueueSubscribers = messageQueueSubscribers;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        RabbitMQSubscriptionService.logger.debug('Booting RabbitMQSubscriptionService...');
        await Promise.all(this.messageQueueSubscribers.map(
            (subscriber: MessageQueueChannelWrapperInterface) => subscriber.subscribe()
                .catch((e) => {
                    if (e instanceof Error) {
                        throw new ApplicationException(`Error subscribing to RabbitMQ! E: ${e.message}`, 'RabbitMQSubscriptionService', 1);
                    } else {
                        RabbitMQSubscriptionService.logger.error('UNEXPECTED ERROR subscribing to RabbitMQ!');
                    }
                }),
        ));
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async start(): Promise<void> {
        RabbitMQSubscriptionService.logger.debug('Starting RabbitMQSubscriptionService... (NOT IMPLEMENTED)');
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async terminate(): Promise<void> {
        RabbitMQSubscriptionService.logger.warn('Terminating RabbitMQSubscriptionService... (NOT IMPLEMENTED)');
        // TODO: Terminate subscription from consuming, drop current messages and mark them as failed
    }
}
