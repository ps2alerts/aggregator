import {ContainerModule} from 'inversify';
import {RedisConnectionFactory} from './RedisConnectionFactory';
import Redis from 'ioredis';

export default new ContainerModule((bind) => {
    bind(RedisConnectionFactory).toSelf().inSingletonScope();

    bind(Redis).toDynamicValue(async ({container}) => {
        const factory = await container.getAsync(RedisConnectionFactory);
        return factory.createClient();
    });
});
