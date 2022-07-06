import {ContainerModule} from 'inversify';
import OverdueInstanceAuthority from './OverdueInstanceAuthority';
import PopulationAuthority from './PopulationAuthority';
import InstanceAuthority from './InstanceAuthority';

export default new ContainerModule((bind) => {
    bind(InstanceAuthority)
        .to(InstanceAuthority)
        .inSingletonScope();

    bind(OverdueInstanceAuthority)
        .toSelf()
        .inSingletonScope();

    bind(PopulationAuthority)
        .toSelf()
        .inSingletonScope();
});
