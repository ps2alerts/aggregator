import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import {ContainerModule} from 'inversify';
import config from '../../config';
import RabbitMQ from '../../config/rabbitmq';
import RabbitMQSubscriptionService from './RabbitMQSubscriptionService';
import AdminWebsocketWrapper from './channels/AdminWebsocketWrapper';
import {TYPES} from '../../constants/types';
import AdminWebsocketMessageHandler from '../../handlers/messages/AdminWebsocketMessageHandler';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(RabbitMQSubscriptionService);

    bind<RabbitMQ>('rabbitMQConfig').toConstantValue(config.rabbitmq);

    bind<AdminWebsocketWrapper>(TYPES.messageQueueSubscribers).to(AdminWebsocketWrapper).inSingletonScope();

    bind<AdminWebsocketMessageHandler>(TYPES.mqAdminMessage).to(AdminWebsocketMessageHandler).inSingletonScope();
});
