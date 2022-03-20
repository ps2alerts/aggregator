import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import {ContainerModule} from 'inversify';
import {RedisConnection} from './RedisConnection';
import RedisConnectionService from './RedisConnectionService';
import {TYPES} from '../../constants/types';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(RedisConnectionService);

    bind<RedisConnection>(RedisConnection)
        .toSelf()
        .inSingletonScope();

    bind(TYPES.redis).toDynamicValue(({container}) => {
        const cacheConnection = container.get(RedisConnection);
        return cacheConnection.getClient();
    }).inSingletonScope();
});
