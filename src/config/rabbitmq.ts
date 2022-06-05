import {get, getInt} from '../utils/env';
import {injectable} from 'inversify';

@injectable()
export default class RabbitMQ {
    public readonly host = get('RABBITMQ_HOST', 'ps2alerts-mq');
    public readonly port = getInt('RABBITMQ_PORT', 5672);
    public readonly user = get('RABBITMQ_USER', 'guest');
    public readonly pass = get('RABBITMQ_PASS', 'guest');
    public readonly exchange = get('RABBITMQ_EXCHANGE', 'ps2alerts');
    public readonly vhost = get('RABBITMQ_VHOST', '');
    public readonly heartbeat = 10;
    public readonly timeout = 5000;
    public readonly apiQueueName = `api-queue-${get('NODE_ENV')}`;
    public readonly apiDelayQueueName = `api-queue-${get('NODE_ENV')}-delay`;
    public readonly aggregatorQueueName = `aggregator-queue-${get('CENSUS_ENVIRONMENT')}`;
    public readonly aggregatorDelayQueueName = `aggregator-queue-${get('CENSUS_ENVIRONMENT')}-delay`;
    public readonly aggregatorPrefetch = 200;
}
