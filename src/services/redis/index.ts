import {ContainerModule} from 'inversify';
import {RedisConnectionFactory} from './RedisConnectionFactory';
import {TYPES} from '../../constants/types';

export default new ContainerModule((bind) => {
    bind(RedisConnectionFactory).toSelf().inSingletonScope();

    bind(TYPES.redis).toDynamicValue(async ({container}) => {
        const factory = await container.getAsync(RedisConnectionFactory);
        return factory.createClient();
    });
});
