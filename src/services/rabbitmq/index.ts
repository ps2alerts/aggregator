import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import {ContainerModule} from 'inversify';
import config from '../../config';
import RabbitMQ from '../../config/rabbitmq';
import RabbitMQSubscriptionService from './RabbitMQSubscriptionService';
import AdminAggregatorWrapper from './channels/AdminAggregatorWrapper';
import {TYPES} from '../../constants/types';
import AdminAggregatorMessageHandler from '../../handlers/messages/AdminAggregatorMessageHandler';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(RabbitMQSubscriptionService);

    bind<RabbitMQ>('rabbitMQConfig').toConstantValue(config.rabbitmq);

    bind<AdminAggregatorWrapper>(TYPES.messageQueueSubscribers).to(AdminAggregatorWrapper).inSingletonScope();

    bind<AdminAggregatorMessageHandler>(TYPES.mqAdminMessage).to(AdminAggregatorMessageHandler).inSingletonScope();
});
