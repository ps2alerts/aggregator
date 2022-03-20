import {ContainerModule} from 'inversify';
import OverdueInstanceAuthority from './OverdueInstanceAuthority';
import PopulationAuthority from './PopulationAuthority';
import CensusStaleConnectionWatcherAuthority from './CensusStaleConnectionWatcherAuthority';
import InstanceAuthority from './InstanceAuthority';
import {TYPES} from '../constants/types';

export default new ContainerModule((bind) => {
    bind(TYPES.instanceAuthority)
        .to(InstanceAuthority)
        .inSingletonScope();

    bind(OverdueInstanceAuthority)
        .toSelf()
        .inSingletonScope();

    bind(PopulationAuthority)
        .toSelf()
        .inSingletonScope();

    bind(CensusStaleConnectionWatcherAuthority)
        .toSelf()
        .inSingletonScope();
});
