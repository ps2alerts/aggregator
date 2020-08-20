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
    public readonly exchange = get('RABBITMQ_EXCHANGE', 'ps2alertsExchange');
    public readonly vhost = get('RABBITMQ_VHOST', 'ps2alerts');
    public readonly heartbeat = 10;
    public readonly timeout = 10000;
}
