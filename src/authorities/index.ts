import {ContainerModule} from 'inversify';
import OverdueInstanceAuthority from './OverdueInstanceAuthority';
import PopulationAuthority from './PopulationAuthority';
import InstanceAuthority from './InstanceAuthority';
import TimingStatisticsAuthority from './TimingStatisticsAuthority';
import QueueAuthority from './QueueAuthority';
import Redis from 'ioredis';

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
        return new TimingStatisticsAuthority(await context.container.getAsync(Redis));
    }).inSingletonScope();
});
