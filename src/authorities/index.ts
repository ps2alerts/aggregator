import {ContainerModule} from 'inversify';
import OverdueInstanceAuthority from './OverdueInstanceAuthority';
import PopulationAuthority from './PopulationAuthority';
import InstanceAuthority from './InstanceAuthority';
import TimingStatisticsAuthority from './TimingStatisticsAuthority';
import {TYPES} from '../constants/types';
import QueueAuthority from './QueueAuthority';

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

    bind(QueueAuthority)
        .toSelf()
        .inSingletonScope();

    bind(TimingStatisticsAuthority).toDynamicValue(async (context) => {
        return new TimingStatisticsAuthority(await context.container.getAsync(TYPES.redis));
    }).inSingletonScope();
});
