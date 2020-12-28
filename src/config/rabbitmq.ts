import {
    get, getInt,
} from '../utils/env';
import {injectable} from 'inversify';

@injectable()
export default class RabbitMQ {
    public readonly host = get('RABBITMQ_HOST', 'ps2alerts-mq');
    public readonly port = getInt('RABBITMQ_PORT', 5672);
    public readonly user = get('RABBITMQ_USER', 'user');
    public readonly pass = get('RABBITMQ_PASS', 'bitnami');
    public readonly exchange = get('RABBITMQ_EXCHANGE', 'ps2alerts');
    public readonly delayExchange = get('RABBITMQ_DELAY_EXCHANGE', 'ps2alerts-delay');
    public readonly vhost = get('RABBITMQ_VHOST', '');
    public readonly heartbeat = 10;
    public readonly timeout = 10000;
    public readonly apiQueueName = get('RABBITMQ_API_QUEUE', 'api-queue');
    public readonly apiDelayQueueName = get('RABBITMQ_API_QUEUE_DELAY', 'api-queue-delay');
}
