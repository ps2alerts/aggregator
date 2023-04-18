import {Injectable, Logger, OnApplicationBootstrap, OnModuleInit} from '@nestjs/common';
import OverdueInstanceAuthority from '../../authorities/OverdueInstanceAuthority';
import PopulationAuthority from '../../authorities/PopulationAuthority';
import InstanceAuthority from '../../authorities/InstanceAuthority';
import MetricsAuthority from '../../authorities/MetricsAuthority';
import QueueAuthority from '../../authorities/QueueAuthority';

@Injectable()
export default class AuthorityService implements OnModuleInit, OnApplicationBootstrap {
    private static readonly logger = new Logger('AuthorityService');

    constructor(
        private readonly instanceAuthority: InstanceAuthority,
        private readonly overdueInstanceAuthority: OverdueInstanceAuthority,
        private readonly populationAuthority: PopulationAuthority,
        private readonly queueAuthority: QueueAuthority,
        private readonly timingStatisticsAuthority: MetricsAuthority,
    ) {}

    public async onModuleInit(): Promise<void> {
        AuthorityService.logger.debug('Booting Authority Services...');
        await this.timingStatisticsAuthority.run();
    }

    public async onApplicationBootstrap(): Promise<void> {
        await this.instanceAuthority.init();

        AuthorityService.logger.debug('Starting Authority Services...');
        this.overdueInstanceAuthority.run();
        this.populationAuthority.run();
        this.queueAuthority.run();
    }
}
