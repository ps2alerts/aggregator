import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import config from '../../config';
import CensusStreamService from './CensusStreamService';
import Client from 'ps2census/dist/client/Client';
import {EventStreamManagerConfig} from 'ps2census/dist/client/utils/Types';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(CensusStreamService);

    const streamManagerConfig: EventStreamManagerConfig = {
        subscriptions: config.census.ps2WsConfig.subscriptions,
    };

    bind(Client)
        .toDynamicValue(() => new Client({
            serviceId: config.census.serviceID,
            streamManagerConfig,
        }))
        .inSingletonScope();
});
