import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import CensusEventSubscriberService from './CensusEventSubscriberService';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(CensusEventSubscriberService);

    bind(CensusEventSubscriberService)
        .toSelf()
        .inSingletonScope();
});
