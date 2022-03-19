import {inject, injectable} from 'inversify';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {getLogger} from '../logger';
import {TYPES} from '../constants/types';
import InstanceAuthority from './InstanceAuthority';
import {getCensusEnvironment} from '../utils/CensusEnvironment';

@injectable()
export default class OverdueInstanceAuthority {
    private static readonly logger = getLogger('OverdueInstanceAuthority');
    private readonly instanceAuthority: InstanceAuthority;
    private timer?: NodeJS.Timeout;

    constructor(@inject(TYPES.instanceAuthority) instanceAuthority: InstanceAuthority) {
        this.instanceAuthority = instanceAuthority;
    }

    public run(): void {
        if (this.timer) {
            OverdueInstanceAuthority.logger.warn('Attempted to run OverdueInstanceAuthority timer when already defined!');
            this.stop();
        }

        this.timer = setInterval(() => {
            OverdueInstanceAuthority.logger.debug('Running OverdueInstanceAuthority overdue alert check');

            this.instanceAuthority.getAllInstances().filter((instance) => {
                return instance.overdue();
            }).forEach((instance: PS2AlertsInstanceInterface) => {
                try {
                    OverdueInstanceAuthority.logger.warn(`Instance ${instance.instanceId} on world ${instance.world} is OVERDUE! Ending!`);
                    void this.instanceAuthority.endInstance(instance, getCensusEnvironment(instance.world));
                } catch (err) {
                    if (err instanceof Error) {
                        OverdueInstanceAuthority.logger.error(`Overdue instance ${instance.instanceId} was unable to be forcefully ended! E: ${err.message}`);
                    }
                }
            });
        }, 15000);

        OverdueInstanceAuthority.logger.debug('Created OverdueInstanceAuthority timer');
    }

    public stop(): void {
        OverdueInstanceAuthority.logger.debug('Clearing OverdueInstanceAuthority timer');

        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}
