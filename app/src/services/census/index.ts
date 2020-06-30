import { ContainerModule } from 'inversify';
import Service, { SERVICE } from '../../interfaces/Service';
import config from '../../config';
import PS2EventClient from 'ps2census/dist/client/Client'; // TODO: Await microwave's type fixes
import CensusStreamService from './CensusStreamService';
import { PS2ClientConfig } from 'ps2census/dist/client/utils/Types';

export default new ContainerModule(bind => {
    bind<Service>(SERVICE).to(CensusStreamService);

    const censusSocketConfig:PS2ClientConfig = {
        subscriptions: config.census.ps2WsConfig.subscriptions,
    };

    bind(PS2EventClient)
        .toDynamicValue(() => new PS2EventClient(
            config.census.serviceID,
            censusSocketConfig
        ))
        .inSingletonScope();
});
