import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../interfaces/ServiceInterface';
import CensusStreamService from '../services/census/CensusStreamService';
import CensusCacheDriver from './CensusCacheDriver';
import {TYPES} from '../constants/types';
import {CensusClient} from 'ps2census';
import config from '../config';
import {Ps2AlertsApiDriver} from './Ps2AlertsApiDriver';
import {AxiosInstance} from 'axios';

export default new ContainerModule((bind) => {
    // Boot the Census Stream services
    bind<ServiceInterface>(SERVICE).to(CensusStreamService).inSingletonScope();

    bind<CensusCacheDriver>(TYPES.censusCharacterCacheDriver)
        .toDynamicValue(({container}) => new CensusCacheDriver(
            container.get(TYPES.redis),
            'character',
            86400,
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

    bind(Ps2AlertsApiDriver).toSelf().inSingletonScope();
    bind<AxiosInstance>(TYPES.ps2AlertsApiClient).toDynamicValue(({container}) => {
        const driver = container.get(Ps2AlertsApiDriver);
        return driver.getClient();
    });
});
