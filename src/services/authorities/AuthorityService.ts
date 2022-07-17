import {injectable} from 'inversify';
import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import OverdueInstanceAuthority from '../../authorities/OverdueInstanceAuthority';
import PopulationAuthority from '../../authorities/PopulationAuthority';
import InstanceAuthority from '../../authorities/InstanceAuthority';
import TimingStatisticsAuthority from '../../authorities/TimingStatisticsAuthority';

@injectable()
export default class AuthorityService implements ServiceInterface {
    public readonly bootPriority = 50;
    private static readonly logger = getLogger('AuthorityService');

    constructor(
        private readonly instanceAuthority: InstanceAuthority,
        private readonly overdueInstanceAuthority: OverdueInstanceAuthority,
        private readonly populationAuthority: PopulationAuthority,
        private readonly timingStatisticsAuthority: TimingStatisticsAuthority,
    ) {}

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        AuthorityService.logger.debug('Booting Authority Services...');
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async start(): Promise<void> {
        await this.instanceAuthority.init();

        AuthorityService.logger.debug('Starting Authority Services...');
        this.overdueInstanceAuthority.run();
        this.populationAuthority.run();
        await this.timingStatisticsAuthority.run();
    }

    // This isn't implemented as it appears to do it automatically
    // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-empty-function
    public async terminate(): Promise<void> {}
}
