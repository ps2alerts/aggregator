import {
    get, getInt,
} from '../utils/env';
import {injectable} from 'inversify';

@injectable()
export default class RabbitMQ {
    public readonly host = get('MQ_HOST', 'ps2alerts-mq');
    public readonly port = getInt('MQ_PORT', 5672);
    public readonly user = get('MQ_USER', 'user');
    public readonly pass = get('MQ_PASS', 'bitnami');
    public readonly exchange = get('MQ_EXCHANGE', 'ps2alertsExchange');
    public readonly queues = {
        adminWebsocket: {
            name: 'test',
        },
    };
}
