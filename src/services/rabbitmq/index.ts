import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import {ContainerModule} from 'inversify';
import config from '../../config';
import RabbitMQConnectionService from './RabbitMQConnectionService';
import AdminAggregatorSubscriber from './subscribers/AdminAggregatorSubscriber';
import {TYPES} from '../../constants/types';
import AdminAggregatorMessageHandler from '../../handlers/AdminAggregatorMessageHandler';
import ApiMQPublisher from './publishers/ApiMQPublisher';
import ApiMQDelayPublisher from './publishers/ApiMQDelayPublisher';
import MetagameSubscriber from './subscribers/MetagameSubscriber';
import {AmqpConnectionManager, connect} from 'amqp-connection-manager';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(RabbitMQConnectionService);

    // Rabbit Connection
    bind<AmqpConnectionManager>(TYPES.rabbitMqConnection).toDynamicValue(() => {
        const mqConfig = config.rabbitmq;
        return connect(`amqp://${mqConfig.user}:${mqConfig.pass}@${mqConfig.host}:${mqConfig.port}${mqConfig.vhost}?heartbeat=${mqConfig.heartbeat}&connection_timeout=${mqConfig.timeout}`);
    });

    // RabbitMQ Subscribers / Consumers
    bind<AdminAggregatorSubscriber>(TYPES.rabbitMQSubscribers).to(AdminAggregatorSubscriber).inSingletonScope();
    bind<MetagameSubscriber>(TYPES.rabbitMQSubscribers).to(MetagameSubscriber).inSingletonScope();

    // RabbitMQ Publishers
    bind<ApiMQPublisher>(TYPES.rabbitMQPublishers).to(ApiMQPublisher);
    bind<ApiMQDelayPublisher>(TYPES.rabbitMQPublishers).to(ApiMQDelayPublisher);

    // Message Handlers (which actually do the things with data)
    bind<AdminAggregatorMessageHandler>(TYPES.adminMessageHandlers).to(AdminAggregatorMessageHandler).inSingletonScope();
});
