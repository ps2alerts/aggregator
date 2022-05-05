import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../interfaces/ServiceInterface';
import CensusStreamService from '../services/census/CensusStreamService';
import CensusCacheDriver from './CensusCacheDriver';
import {TYPES} from '../constants/types';
import {CensusClient} from 'ps2census';
import config from '../config';

export default new ContainerModule((bind) => {
    // Boot the Census Stream services
    bind<ServiceInterface>(SERVICE).to(CensusStreamService).inSingletonScope();

    bind<CensusCacheDriver>(TYPES.censusCharacterCacheDriver)
        .toDynamicValue(async ({container}) => new CensusCacheDriver(
            await container.getAsync(TYPES.redis),
            'character',
            86400,
        )).inSingletonScope();

    bind(CensusClient)
        .toDynamicValue(async ({container}) => {
            const clientConfig = {...config.census.clientOptions};
            clientConfig.characterManager = {
                ...clientConfig.characterManager,
                cache: await container.getAsync(TYPES.censusCharacterCacheDriver),
            };

            return new CensusClient(config.census.serviceID, config.census.censusEnvironment, clientConfig);
        }).inSingletonScope();
});
