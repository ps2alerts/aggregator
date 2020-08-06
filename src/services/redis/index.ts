import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import {ContainerModule} from 'inversify';
import {RedisConnection} from './RedisConnection';
import config from '../../config';
import Redis from '../../config/redis';
import RedisConnectionService from './RedisConnectionService';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(RedisConnectionService);

    bind<Redis>('redisConfig').toConstantValue(config.redis);

    bind<RedisConnection>(RedisConnection)
        .toSelf()
        .inSingletonScope();
});
