import {ContainerModule} from 'inversify';
import ActiveAlertAuthority from './ActiveAlertAuthority';

export default new ContainerModule((bind) => {
    bind(ActiveAlertAuthority)
        .toSelf()
        .inSingletonScope();
});
