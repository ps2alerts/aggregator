export const config = () => ({
    census: {
        serviceID: process.env.CENSUS_SERVICE_ID,
        environment: 'ps2',
        worlds: process.env.CENSUS_SUBSCRIPTION_WORLDS.split(',') ?? ['all'],
    },

    rabbitmq: {
        urls: [process.env.RMQ_URL ?? 'amqp://localhost:5672'],
        queue: process.env.RMQ_QUEUE ?? 'aggregator',
        queueOptions: {
            durable: false,
        },
    },

    api: {
        urls: [process.env.RMQ_API_URL ?? 'amqp:localhost:5672'],
        queue: process.env.RMQ_API_QUEUE ?? 'api',
        queueOptions: {
            durable: false,
        },
    },
});
