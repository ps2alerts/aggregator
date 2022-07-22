import {ContainerModule} from 'inversify';
import {CensusClient, CharacterManager, Rest} from 'ps2census';
import {TYPES} from '../../constants/types';
import axios from 'axios';

export default new ContainerModule((bind) => {
    bind(Rest.Client).toDynamicValue(async ({container}) => {
        const censusClient = await container.getAsync(CensusClient);
        return censusClient.rest;
    }).inSingletonScope();

    bind(TYPES.falconApiClient).toDynamicValue(() => {
        return axios.create({
            baseURL: 'https://census.lithafalcon.cc/get/ps2',
            timeout: 5000,
        });
    });

    bind(CharacterManager).toDynamicValue(async ({container}) => {
        const censusClient = await container.getAsync(CensusClient);
        return censusClient.characterManager;
    }).inSingletonScope();
});
