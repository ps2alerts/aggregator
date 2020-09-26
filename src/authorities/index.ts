import {ContainerModule} from 'inversify';
import {TYPES} from '../constants/types';
import OverdueInstanceAuthority from './OverdueInstanceAuthority';
import PopulationAuthority from './PopulationAuthority';
import CensusStaleConnectionWatcherAuthority from './CensusStaleConnectionWatcherAuthority';

export default new ContainerModule((bind) => {
    bind(TYPES.overdueInstanceAuthority)
        .to(OverdueInstanceAuthority)
        .inSingletonScope();

    bind(TYPES.populationAuthority)
        .to(PopulationAuthority)
        .inSingletonScope();

    bind(TYPES.censusStaleConnectionWatcherAuthority)
        .to(CensusStaleConnectionWatcherAuthority)
        .inSingletonScope();
});
