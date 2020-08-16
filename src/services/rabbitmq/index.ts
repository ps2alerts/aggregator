import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import {ContainerModule} from 'inversify';
import config from '../../config';
import RabbitMQ from '../../config/rabbitmq';
import RabbitMQSubscriptionService from './RabbitMQSubscriptionService';
import {RabbitMQSubscription} from './RabbitMQSubscription';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(RabbitMQSubscriptionService);

    bind<RabbitMQ>('rabbitMQConfig').toConstantValue(config.rabbitmq);

    bind<RabbitMQSubscription>(RabbitMQSubscription)
        .toSelf()
        .inSingletonScope();
});
