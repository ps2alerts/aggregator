import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import config from '../../config';
import {CensusClient} from 'ps2census';
import Census from '../../config/census';
import CensusCacheDriver from '../../drivers/CensusCacheDriver';
import {TYPES} from '../../constants/types';
import {RedisConnection} from '../redis/RedisConnection';
import CensusStreamService from './CensusStreamService';
import CensusStream from './CensusStream';
import CensusEventSubscriber from './CensusEventSubscriber';

export default new ContainerModule((bind) => {
    bind<Census>(TYPES.censusConfig).toConstantValue(config.census);

    // Boot the Census Stream services
    bind<ServiceInterface>(SERVICE).to(CensusStreamService).inSingletonScope();

    // Driver
    bind<CensusCacheDriver>(TYPES.censusCharacterCacheDriver)
        .toDynamicValue(({container}) => new CensusCacheDriver(
            'character',
            86400,
            container.get(RedisConnection),
        )).inSingletonScope();

    bind(CensusClient)
        .toDynamicValue(({container}) => {
            const clientConfig = {...config.census.clientOptions};

            clientConfig.characterManager = {
                ...clientConfig.characterManager,
                cache: container.get(TYPES.censusCharacterCacheDriver),
            };

            return new CensusClient(config.census.serviceID, config.census.censusEnvironment, clientConfig);
        }).inSingletonScope();

    bind(CensusStream).toSelf().inSingletonScope();

    bind(CensusEventSubscriber).toSelf().inSingletonScope();
});
