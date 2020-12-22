import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import AuthorityService from './AuthorityService';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(AuthorityService);
});
