import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import {ContainerModule} from 'inversify';
import RabbitMQConnectionService from './RabbitMQConnectionService';
import AdminAggregatorSubscriber from './subscribers/AdminAggregatorSubscriber';
import {TYPES} from '../../constants/types';
import AdminAggregatorMessageHandler from '../../handlers/messages/AdminAggregatorMessageHandler';
import {RabbitMQConnectionHandlerFactory} from './RabbitMQConnectionHandlerFactory';
import ApiMQPublisher from './publishers/ApiMQPublisher';
import ApiMQDelayPublisher from './publishers/ApiMQDelayPublisher';
import AggregatorMQPublisher from './publishers/AggregatorMQPublisher';
import AggregatorMQDelayPublisher from './publishers/AggregatorMQDelayPublisher';
import AggregatorQueueSubscriber from './subscribers/AggregatorQueueSubscriber';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(RabbitMQConnectionService);

    // Connection Factory
    bind(RabbitMQConnectionHandlerFactory).to(RabbitMQConnectionHandlerFactory).inSingletonScope();

    // RabbitMQ Publishers
    bind(AggregatorMQPublisher).to(AggregatorMQPublisher).inSingletonScope();
    bind<AggregatorMQPublisher>(TYPES.rabbitMQPublishers).toService(AggregatorMQPublisher);

    bind(AggregatorMQDelayPublisher).to(AggregatorMQDelayPublisher).inSingletonScope();
    bind<AggregatorMQDelayPublisher>(TYPES.rabbitMQPublishers).toService(AggregatorMQDelayPublisher);

    bind(ApiMQDelayPublisher).to(ApiMQDelayPublisher).inSingletonScope();
    bind<ApiMQDelayPublisher>(TYPES.rabbitMQPublishers).toService(ApiMQDelayPublisher);

    bind(ApiMQPublisher).to(ApiMQPublisher).inSingletonScope();
    bind<ApiMQPublisher>(TYPES.rabbitMQPublishers).toService(ApiMQPublisher);

    // RabbitMQ Subscribers  / Consumers
    bind<AdminAggregatorSubscriber>(TYPES.rabbitMQSubscribers).to(AdminAggregatorSubscriber).inSingletonScope();
    bind<AggregatorQueueSubscriber>(TYPES.rabbitMQSubscribers).to(AggregatorQueueSubscriber).inSingletonScope();

    // Message Handlers (which actually do the things with data)
    bind<AdminAggregatorMessageHandler>(TYPES.adminMessageHandlers).to(AdminAggregatorMessageHandler).inSingletonScope();
});
