import {inject, injectable} from 'inversify';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {getLogger} from '../logger';
import {TYPES} from '../constants/types';
import InstanceHandlerInterface from '../interfaces/InstanceHandlerInterface';

@injectable()
export default class OverdueInstanceAuthority {
    private static readonly logger = getLogger('OverdueInstanceAuthority');
    private readonly instanceHandler: InstanceHandlerInterface;
    private timer?: NodeJS.Timeout;

    constructor(@inject(TYPES.instanceHandlerInterface) instanceHandler: InstanceHandlerInterface) {
        this.instanceHandler = instanceHandler;
    }

    public run(): void {
        if (this.timer) {
            OverdueInstanceAuthority.logger.warn('Attempted to run OverdueInstanceAuthority timer when already defined!');
            this.stop();
        }

        OverdueInstanceAuthority.logger.debug('Creating OverdueInstanceAuthority timer');

        this.timer = setInterval(() => {
            OverdueInstanceAuthority.logger.debug('Running OverdueInstanceAuthority overdue alert check');

            this.instanceHandler.getAllInstances().filter((instance) => {
                return instance.overdue();
            }).forEach((instance: PS2AlertsInstanceInterface) => {
                try {
                    OverdueInstanceAuthority.logger.warn(`Instance ${instance.instanceId} on world ${instance.world} is OVERDUE! Ending!`);
                    void this.instanceHandler.endInstance(instance);
                } catch (err) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                    OverdueInstanceAuthority.logger.error(`Overdue instance ${instance.instanceId} was unable to be forcefully ended! E: ${err.message}`);
                }
            });
        }, 15000);
    }

    public stop(): void {
        OverdueInstanceAuthority.logger.debug('Clearing OverdueInstanceAuthority timer');

        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}
