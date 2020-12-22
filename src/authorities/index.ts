import {ContainerModule} from 'inversify';
import {TYPES} from '../constants/types';
import OverdueInstanceAuthority from './OverdueInstanceAuthority';
import PopulationAuthority from './PopulationAuthority';
import CensusStaleConnectionWatcherAuthority from './CensusStaleConnectionWatcherAuthority';
import InstanceAuthority from './InstanceAuthority';

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
        .toDynamicValue(({container}) => new CensusStaleConnectionWatcherAuthority(
            container.get(TYPES.pcWebsocketClient),
            'ps2',
        ));

    bind(TYPES.ps2ps4euCensusStaleConnectionWatcherAuthority)
        .toDynamicValue(({container}) => new CensusStaleConnectionWatcherAuthority(
            container.get(TYPES.ps2ps4euWebsocketClient),
            'ps2ps4eu',
        ));

    bind(TYPES.ps2ps4usCensusStaleConnectionWatcherAuthority)
        .toDynamicValue(({container}) => new CensusStaleConnectionWatcherAuthority(
            container.get(TYPES.ps2ps4usWebsocketClient),
            'ps2ps4us',
        ));
});
