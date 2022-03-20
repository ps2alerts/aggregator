import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import config from '../../config';
import {CensusClient, CharacterManager} from 'ps2census';
import CensusCacheDriver from '../../drivers/CensusCacheDriver';
import {TYPES} from '../../constants/types';
import CensusStreamService from './CensusStreamService';
import CensusStream from './CensusStream';
import CensusEventSubscriber from './CensusEventSubscriber';
import {RestClient} from 'ps2census/dist/rest';

export default new ContainerModule((bind) => {
    // Boot the Census Stream services
    bind<ServiceInterface>(SERVICE).to(CensusStreamService).inSingletonScope();

    // Driver
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

    bind(CensusStream).toSelf().inSingletonScope();

    bind(CensusEventSubscriber).toSelf().inSingletonScope();

    bind(RestClient).toDynamicValue(({container}) => {
        const censusClient = container.get(CensusClient);
        return censusClient.rest;
    }).inSingletonScope();

    bind(CharacterManager).toDynamicValue(({container}) => {
        const censusClient = container.get(CensusClient);
        return censusClient.characterManager;
    }).inSingletonScope();
});
