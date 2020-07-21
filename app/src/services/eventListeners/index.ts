import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import EventListenerService from './EventListenerService';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(EventListenerService);

    bind(EventListenerService)
        .toSelf()
        .inSingletonScope();
});
