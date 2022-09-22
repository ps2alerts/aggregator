import {get, getInt} from '../utils/env';
import {Injectable} from '@nestjs/common';

@Injectable()
export default class RabbitMQ {
    public readonly host = get('RABBITMQ_HOST', 'ps2alerts-mq');
    public readonly port = getInt('RABBITMQ_PORT', 5672);
    public readonly user = get('RABBITMQ_USER', 'guest');
    public readonly pass = get('RABBITMQ_PASS', 'guest');
    public readonly exchange = get('RABBITMQ_EXCHANGE', 'ps2alerts');
    public readonly topicExchange = get('RABBITMQ_TOPIC_EXCHANGE', 'ps2alerts-topic');
    public readonly vhost = get('RABBITMQ_VHOST', '/');
    public readonly heartbeat = 10;
    public readonly timeout = 5000;
    public readonly apiQueueName = get('RABBITMQ_API_QUEUE', 'api-queue');
    public readonly apiDelayQueueName = get('RABBITMQ_API_QUEUE_DELAY', 'api-queue-delay');

    get connectionUrl(): string {
        return `amqp://${this.user}:${this.pass}@${this.host}:${this.port}${this.vhost}?heartbeat=${this.heartbeat}&connection_timeout=${this.timeout}`;
    }
}
