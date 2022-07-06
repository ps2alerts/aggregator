import {ContainerModule} from 'inversify';
import {CensusClient, CharacterManager, Rest} from 'ps2census';

export default new ContainerModule((bind) => {
    bind(Rest.Client).toDynamicValue(async ({container}) => {
        const censusClient = await container.getAsync(CensusClient);
        return censusClient.rest;
    }).inSingletonScope();

    bind(CharacterManager).toDynamicValue(async ({container}) => {
        const censusClient = await container.getAsync(CensusClient);
        return censusClient.characterManager;
    }).inSingletonScope();
});
