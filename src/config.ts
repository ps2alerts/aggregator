import {env, envInt, envSplit} from './utils/env';
import {random} from 'lodash';

export const config = () => ({
    /** Basis */
    app: {
        environment: env('NODE_ENV'),
        version: env('VERSION'),
        runId: random(1, 1337),
        port: envInt('APP_PORT', 10, 3000),
    },

    logger: {
        levels: envSplit('LOG_LEVELS', ['error','warn','log','debug']),
    },

    /** Services */
    census: {
        serviceID: env('CENSUS_SERVICE_ID'),
        environment: env('CENSUS_ENVIRONMENT'),
    },

    internalApi: {
        host: env('INTERNAL_API_HOST', 'http://ps2alerts-api:3000'),
        username: env('INTERNAL_API_USER', 'ps2alerts'),
        password: env('INTERNAL_API_PASS', 'foobar'),
    },

    rabbitmq: {
        urls: envSplit('RABBITMQ_URLS', ['amqp://guest:guest@$ps2alerts-mq:5672/?heartbeat=10&connection_timeout=5000']),
        exchange: env('RABBITMQ_EXCHANGE', 'ps2alerts'),
        topicExchange: env('RABBITMQ_TOPIC_EXCHANGE', 'ps2alerts-topic'),
        apiQueueName: env('RABBITMQ_API_QUEUE', 'api-queue'),
        apiDelayQueueName: env('RABBITMQ_API_QUEUE_DELAY', 'api-queue-delay'),
    },

    redis: {
        host: env('REDIS_HOST', 'ps2alerts-redis'),
        port: envInt('REDIS_PORT', 10, 6379),
        password: env('REDIS_PASS', ''),
    },
});
