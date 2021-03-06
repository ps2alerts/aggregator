import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import {ContainerModule} from 'inversify';
import config from '../../config';
import RabbitMQ from '../../config/rabbitmq';
import RabbitMQConnectionService from './RabbitMQConnectionService';
import AdminAggregatorSubscriber from './subscribers/AdminAggregatorSubscriber';
import {TYPES} from '../../constants/types';
import AdminAggregatorMessageHandler from '../../handlers/messages/AdminAggregatorMessageHandler';
import {RabbitMQConnectionHandlerFactory} from './RabbitMQConnectionHandlerFactory';
import ApiMQPublisher from './publishers/ApiMQPublisher';
import ApiMQDelayPublisher from './publishers/ApiMQDelayPublisher';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(RabbitMQConnectionService);

    bind<RabbitMQ>('rabbitMQConfig').toConstantValue(config.rabbitmq);

    // Connection Factory
    bind<RabbitMQConnectionHandlerFactory>(TYPES.rabbitMqConnectionHandlerFactory).to(RabbitMQConnectionHandlerFactory).inSingletonScope();

    // RabbitMQ Subscribers / Consumers
    bind<AdminAggregatorSubscriber>(TYPES.rabbitMQSubscribers).to(AdminAggregatorSubscriber).inSingletonScope();

    // RabbitMQ Publishers
    bind<ApiMQPublisher>(TYPES.apiMQPublisher).to(ApiMQPublisher).inSingletonScope();
    bind<ApiMQDelayPublisher>(TYPES.apiMQDelayPublisher).to(ApiMQDelayPublisher).inSingletonScope();
    bind<ApiMQPublisher>(TYPES.rabbitMQPublishers).toService(TYPES.apiMQPublisher);
    bind<ApiMQPublisher>(TYPES.rabbitMQPublishers).toService(TYPES.apiMQDelayPublisher);

    // Message Handlers (which actually do the things with data)
    bind<AdminAggregatorMessageHandler>(TYPES.adminMessageHandlers).to(AdminAggregatorMessageHandler).inSingletonScope();
});
