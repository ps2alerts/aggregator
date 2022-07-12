import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import {ContainerModule} from 'inversify';
import config from '../../config';
import RabbitMQConnectionService from './RabbitMQConnectionService';
import AdminAggregatorSubscriber from './subscribers/AdminAggregatorSubscriber';
import {TYPES} from '../../constants/types';
import ApiMQPublisher from './publishers/ApiMQPublisher';
import ApiMQDelayPublisher from './publishers/ApiMQDelayPublisher';
import MetagameSubscriber from './subscribers/MetagameSubscriber';
import {AmqpConnectionManager, connect} from 'amqp-connection-manager';
import RabbitMQChannelFactory from '../../factories/RabbitMQChannelFactory';

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
    bind(ApiMQPublisher).toDynamicValue(async (context) => {
        const publisher = new ApiMQPublisher(await context.container.getAsync(RabbitMQChannelFactory));
        publisher.connect();
        return publisher;
    }).inSingletonScope();
    bind(ApiMQDelayPublisher).toDynamicValue(async (context) => {
        const publisher = new ApiMQDelayPublisher(await context.container.getAsync(RabbitMQChannelFactory));
        publisher.connect();
        return publisher;
    }).inSingletonScope();
});
