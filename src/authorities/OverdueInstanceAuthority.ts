import {inject, injectable} from 'inversify';
import PS2AlertsInstanceInterface from '../instances/PS2AlertsInstanceInterface';
import {getLogger} from '../logger';
import {TYPES} from '../constants/types';
import InstanceHandlerInterface from '../interfaces/InstanceHandlerInterface';

@injectable()
export default class OverdueInstanceAuthority {
    private static readonly logger = getLogger('OverdueInstanceAuthority');

    private readonly instanceHandler: InstanceHandlerInterface;

    private timer: NodeJS.Timeout | null;

    private readonly threshold = 60000; // 1 min

    constructor(@inject(TYPES.instanceHandlerInterface) instanceHandler: InstanceHandlerInterface) {
        this.instanceHandler = instanceHandler;
    }

    public run(): void {
        OverdueInstanceAuthority.logger.debug('Created OverdueInstanceAuthority timer');

        this.timer = setInterval(() => {
            const instances: Map<string, PS2AlertsInstanceInterface> = this.instanceHandler.getAllInstances();

            OverdueInstanceAuthority.logger.debug('Running OverdueInstanceAuthority overdue alert check');
            instances.forEach((instance: PS2AlertsInstanceInterface) => {
                const expectedDuration: number = instance.duration();
                const expectedEndTimestamp: number = (instance.timeStarted.getTime() + expectedDuration) + this.threshold;
                const diff = Date.now() - (expectedEndTimestamp * 1000); // If POSITIVE, overdue

                if (diff > 0) {
                    try {
                        OverdueInstanceAuthority.logger.warn(`Instance ${instance.instanceId} on world ${instance.world} is OVERDUE by ${diff}, ending!`);
                        void this.instanceHandler.endInstance(instance);
                    } catch (err) {
                        OverdueInstanceAuthority.logger.error(`Overdue instance ${instance.instanceId} was unable to be forcefully ended! It is now ${diff} seconds overdue!`);
                    }
                }
            });
        }, 60000);
    }

    public stop(): void {
        OverdueInstanceAuthority.logger.debug('Clearing OverdueInstanceAuthority timer');

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}
