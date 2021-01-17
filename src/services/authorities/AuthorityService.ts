import {inject, injectable} from 'inversify';
import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import OverdueInstanceAuthority from '../../authorities/OverdueInstanceAuthority';
import {TYPES} from '../../constants/types';
import PopulationAuthority from '../../authorities/PopulationAuthority';
import InstanceAuthority from '../../authorities/InstanceAuthority';

@injectable()
export default class AuthorityService implements ServiceInterface {
    public readonly bootPriority = 2;
    private static readonly logger = getLogger('AuthorityService');
    private readonly instanceAuthority: InstanceAuthority;
    private readonly populationAuthority: PopulationAuthority;
    private readonly overdueInstanceAuthority: OverdueInstanceAuthority;

    constructor(
    @inject(TYPES.instanceAuthority) instanceAuthority: InstanceAuthority,
        @inject(TYPES.overdueInstanceAuthority) overdueInstanceAuthority: OverdueInstanceAuthority,
        @inject(TYPES.populationAuthority) populationAuthority: PopulationAuthority,
    ) {
        this.instanceAuthority = instanceAuthority;
        this.overdueInstanceAuthority = overdueInstanceAuthority;
        this.populationAuthority = populationAuthority;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        AuthorityService.logger.debug('Booting Authority Services...');
        await this.instanceAuthority.init();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async start(): Promise<void> {
        AuthorityService.logger.debug('Starting Authority Services...');
        this.overdueInstanceAuthority.run();
        this.populationAuthority.run();
    }

    // This isn't implemented as it appears to do it automatically
    // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-empty-function
    public async terminate(): Promise<void> {}
}
