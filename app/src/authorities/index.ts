import {ContainerModule} from 'inversify';
import {TYPES} from '../constants/types';
import ActiveAlertAuthority from './ActiveAlertAuthority';
import ActiveAlertAuthorityInterface from '../interfaces/ActiveAlertAuthorityInterface';

export default new ContainerModule((bind) => {
    bind<ActiveAlertAuthorityInterface>(TYPES.activeAlertAuthority).to(ActiveAlertAuthority).inSingletonScope();
});
