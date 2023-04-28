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
        private readonly metricsAuthority: MetricsAuthority,
    ) {}

    public async onModuleInit(): Promise<void> {
        AuthorityService.logger.debug('AuthorityServices booting...');
        await this.metricsAuthority.run();
        AuthorityService.logger.debug('Authority Services booted!');

    }

    public async onApplicationBootstrap(): Promise<void> {
        AuthorityService.logger.debug('Starting Authority Services...');
        await this.instanceAuthority.init();
        this.overdueInstanceAuthority.run();
        this.populationAuthority.run();
        this.queueAuthority.run();
        AuthorityService.logger.debug('Authority Services started!');
    }
}
