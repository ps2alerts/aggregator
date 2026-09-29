import {AmqpConnectionManager} from 'amqp-connection-manager';
import {ConfigService} from '@nestjs/config';
import {ApiQueue} from './ApiQueue';
import MetricsHandler from '../../../handlers/MetricsHandler';
import ApiMQMessage from '../../../data/ApiMQMessage';
import ApiMQPublisher from '../publishers/ApiMQPublisher';
import RabbitMQQueueFactory from '../factories/RabbitMQQueueFactory';

const declareAndSend = async (durable: boolean, deadLetterExchange?: string, deadLetterRoutingKey?: string) => {
    const assertQueue = jest.fn<Promise<unknown>, [string, Record<string, unknown>]>().mockResolvedValue({});
    const sendToQueue = jest.fn<Promise<boolean>, [string, unknown, Record<string, unknown>]>().mockResolvedValue(true);
    const manager = {
        createChannel: jest.fn((opts: {setup(channel: unknown): Promise<void>}) => {
            void opts.setup({checkExchange: jest.fn(), assertQueue, bindQueue: jest.fn()});
            return {on: jest.fn(), waitForConnect: jest.fn().mockResolvedValue(undefined), sendToQueue};
        }),
    } as unknown as AmqpConnectionManager;

    const queue = new ApiQueue(manager, 'api-queue-test', {} as MetricsHandler, 'ps2alerts', 1000, durable, deadLetterExchange, deadLetterRoutingKey);
    await queue.connect();
    await queue.send({pattern: 'test', data: {docs: [{}]}} as unknown as ApiMQMessage);

    return {
        options: assertQueue.mock.calls[0][1],
        publishOptions: sendToQueue.mock.calls[0][2],
    };
};

describe('ApiQueue', () => {
    it('declares a non-durable queue memory-only and publishes to it transient', async () => {
        const {options, publishOptions} = await declareAndSend(false);

        expect(options).toMatchObject({durable: false, messageTtl: 1000, arguments: {}});
        expect(publishOptions).toEqual({persistent: false});
    });

    it('keeps a durable delay queue lazy and persistent, dead-lettering to the API queue', async () => {
        const {options, publishOptions} = await declareAndSend(true, '', 'api-queue-test');

        expect(options).toMatchObject({
            durable: true,
            deadLetterExchange: '',
            deadLetterRoutingKey: 'api-queue-test',
            arguments: {'x-queue-mode': 'lazy'},
        });
        expect(publishOptions).toEqual({persistent: true});
    });
});

describe('ApiMQPublisher', () => {
    // RabbitMQ refuses a redeclare with different arguments, so this must equal the api's rabbitmq.queueOptions
    it('declares the API queue memory-only with the api\'s 3 hour TTL', async () => {
        const connect = jest.fn().mockResolvedValue(undefined);
        const createApiQueue = jest.fn().mockReturnValue({connect});
        const factory = {createApiQueue} as unknown as RabbitMQQueueFactory;
        const config = {get: () => 'api-queue-test'} as unknown as ConfigService;

        await new ApiMQPublisher(factory, config).connect();

        expect(createApiQueue).toHaveBeenCalledWith('api-queue-test', 10800000, false);
        expect(connect).toHaveBeenCalled();
    });
});
