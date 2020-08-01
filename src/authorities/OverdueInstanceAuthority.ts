import {inject, injectable} from 'inversify';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {getLogger} from '../logger';
import {TYPES} from '../constants/types';
import InstanceHandlerInterface from '../interfaces/InstanceHandlerInterface';

@injectable()
export default class OverdueInstanceAuthority {
    private static readonly logger = getLogger('OverdueInstanceAuthority');

    private readonly instanceHandler: InstanceHandlerInterface;

    private timer: NodeJS.Timeout | null = null;

    constructor(@inject(TYPES.instanceHandlerInterface) instanceHandler: InstanceHandlerInterface) {
        this.instanceHandler = instanceHandler;
    }

    public run(): void {
        OverdueInstanceAuthority.logger.debug('Created OverdueInstanceAuthority timer');

        if (this.timer) {
            OverdueInstanceAuthority.logger.error('Attempted to run OverdueInstanceAuthority timer when already defined!');
            clearInterval(this.timer);
        }

        this.timer = setInterval(() => {
            const instances: PS2AlertsInstanceInterface[] = this.instanceHandler.getAllInstances();

            OverdueInstanceAuthority.logger.debug('Running OverdueInstanceAuthority overdue alert check');
            instances.forEach((instance: PS2AlertsInstanceInterface) => {
                if (instance.overdue()) {
                    try {
                        OverdueInstanceAuthority.logger.warn(`Instance ${instance.instanceId} on world ${instance.world} is OVERDUE! Ending!`);
                        void this.instanceHandler.endInstance(instance);
                    } catch (err) {
                        OverdueInstanceAuthority.logger.error(`Overdue instance ${instance.instanceId} was unable to be forcefully ended!`);
                    }
                }
            });
        }, 15000);
    }

    public stop(): void {
        OverdueInstanceAuthority.logger.debug('Clearing OverdueInstanceAuthority timer');

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}
