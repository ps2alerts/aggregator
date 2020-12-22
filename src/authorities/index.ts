import {ContainerModule, interfaces} from 'inversify';
import {TYPES} from '../constants/types';
import OverdueInstanceAuthority from './OverdueInstanceAuthority';
import PopulationAuthority from './PopulationAuthority';
import CensusStaleConnectionWatcherAuthority from './CensusStaleConnectionWatcherAuthority';
import InstanceAuthority from './InstanceAuthority';
import Context = interfaces.Context;

export default new ContainerModule((bind) => {
    bind(TYPES.instanceAuthority)
        .to(InstanceAuthority)
        .inSingletonScope();

    bind(TYPES.overdueInstanceAuthority)
        .to(OverdueInstanceAuthority)
        .inSingletonScope();

    bind(TYPES.populationAuthority)
        .to(PopulationAuthority)
        .inSingletonScope();

    bind(TYPES.pcCensusStaleConnectionWatcherAuthority)
        .toDynamicValue(({container}: Context) => new CensusStaleConnectionWatcherAuthority(
            container.get(TYPES.pcWebsocketClient),
            'ps2',
        ));

    bind(TYPES.ps2ps4euCensusStaleConnectionWatcherAuthority)
        .toDynamicValue(({container}: Context) => new CensusStaleConnectionWatcherAuthority(
            container.get(TYPES.ps2ps4euWebsocketClient),
            'ps2ps4eu',
        ));
});
