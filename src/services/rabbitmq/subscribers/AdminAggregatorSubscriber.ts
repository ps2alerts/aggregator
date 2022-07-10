import {injectable} from 'inversify';
import {ChannelWrapper} from 'amqp-connection-manager';
import {RabbitMQSubscriberInterface} from '../../../interfaces/RabbitMQSubscriberInterface';
import {get} from '../../../utils/env';
import RabbitMQChannelFactory from '../../../factories/RabbitMQChannelFactory';
import config from '../../../config';
import AdminAggregatorMessageHandler from '../../../handlers/AdminAggregatorMessageHandler';

@injectable()
export default class AdminAggregatorSubscriber implements RabbitMQSubscriberInterface {
    private static channelWrapper: ChannelWrapper;

    constructor(
        private readonly channelFactory: RabbitMQChannelFactory,
        private readonly adminMessageHandler: AdminAggregatorMessageHandler,
    ) {}

    public connect(): void {
        const queueName = `aggregator-admin-${get('NODE_ENV', 'development')}-${get('CENSUS_ENVIRONMENT', 'pc')}`;

        AdminAggregatorSubscriber.channelWrapper = this.channelFactory.create(
            config.rabbitmq.exchange,
            queueName,
            {},
            '#',
            this.adminMessageHandler,
        );
    }
}
