import {ContainerModule} from 'inversify';
import ActiveInstanceAuthority from './ActiveInstanceAuthority';
import OverdueInstanceAuthority from './OverdueInstanceAuthority';

export default new ContainerModule((bind) => {
    bind(ActiveInstanceAuthority)
        .toSelf()
        .inSingletonScope();

    bind(OverdueInstanceAuthority)
        .toSelf()
        .inSingletonScope();
});
