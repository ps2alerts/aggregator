import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import {ContainerModule} from 'inversify';
import config from '../../config';
import RabbitMQ from '../../config/rabbitmq';
import RabbitMQSubscriptionService from './RabbitMQSubscriptionService';
import AdminAggregatorSubscriber from './subscribers/AdminAggregatorSubscriber';
import {TYPES} from '../../constants/types';
import AdminAggregatorMessageHandler from '../../handlers/messages/AdminAggregatorMessageHandler';
import {RabbitMQConnectionHandlerFactory} from './RabbitMQConnectionHandlerFactory';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(RabbitMQSubscriptionService);

    bind<RabbitMQ>('rabbitMQConfig').toConstantValue(config.rabbitmq);

    // Connection Factory
    bind<RabbitMQConnectionHandlerFactory>(TYPES.rabbitMqConnectionHandlerFactory).to(RabbitMQConnectionHandlerFactory).inSingletonScope();

    // RabbitMQ Subscribers / Consumers
    bind<AdminAggregatorSubscriber>(TYPES.messageQueueSubscribers).to(AdminAggregatorSubscriber).inSingletonScope();

    // Message Handlers (which actually do the things with data)
    bind<AdminAggregatorMessageHandler>(TYPES.mqAdminMessage).to(AdminAggregatorMessageHandler).inSingletonScope();
});
