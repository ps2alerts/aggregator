import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import {CensusClient, CharacterManager, Rest} from 'ps2census';
import CensusStreamService from './CensusStreamService';
import CensusStream from './CensusStream';
import CensusEventSubscriber from './CensusEventSubscriber';

export default new ContainerModule((bind) => {
    // Boot the Census Stream services
    bind<ServiceInterface>(SERVICE).to(CensusStreamService).inSingletonScope();

    bind(CensusStream).toSelf().inSingletonScope();

    bind(CensusEventSubscriber).toSelf().inSingletonScope();

    bind(Rest.Client).toDynamicValue(async ({container}) => {
        const censusClient = await container.getAsync(CensusClient);
        return censusClient.rest;
    }).inSingletonScope();

    bind(CharacterManager).toDynamicValue(async ({container}) => {
        const censusClient = await container.getAsync(CensusClient);
        return censusClient.characterManager;
    }).inSingletonScope();
});
