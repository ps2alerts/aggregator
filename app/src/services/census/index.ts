import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import config from '../../config';
import CensusStreamService from './CensusStreamService';
import {Client, EventStreamManagerConfig} from 'ps2census';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(CensusStreamService);

    const streamManagerConfig: EventStreamManagerConfig = config.census.streamManagerConfig;

    bind(Client)
        .toDynamicValue(() => new Client({
            serviceId: config.census.serviceID,
            streamManagerConfig,
        }))
        .inSingletonScope();
});
