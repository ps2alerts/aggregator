import {ContainerModule} from 'inversify';
import ActiveInstanceAuthority from './ActiveInstanceAuthority';

export default new ContainerModule((bind) => {
    bind(ActiveInstanceAuthority)
        .toSelf()
        .inSingletonScope();
});
