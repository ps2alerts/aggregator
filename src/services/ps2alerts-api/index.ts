import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import ApiConnectionCheckService from './ApiConnectionCheckService';
import {Ps2AlertsApiDriver} from '../../drivers/Ps2AlertsApiDriver';
import {AxiosInstance} from 'axios';
import {TYPES} from '../../constants/types';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(ApiConnectionCheckService);

    bind(Ps2AlertsApiDriver).toSelf().inSingletonScope();

    bind<AxiosInstance>(TYPES.ps2AlertsApiClient).toDynamicValue(async ({container}) => {
        const driver = await container.getAsync(Ps2AlertsApiDriver);
        return driver.getClient();
    });
});
