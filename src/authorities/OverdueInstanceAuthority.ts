import ActiveInstanceAuthority from './ActiveInstanceAuthority';
import {inject, injectable} from 'inversify';
import ActiveInstanceInterface from '../interfaces/ActiveInstanceInterface';
import MetagameUtils from '../utils/MetagameUtils';
import {getLogger} from '../logger';
import {TYPES} from '../constants/types';

@injectable()
export default class OverdueInstanceAuthority {
    private static readonly logger = getLogger('OverdueInstanceAuthority');

    private readonly activeInstanceAuthority: ActiveInstanceAuthority;

    private timer: NodeJS.Timeout | null;

    private readonly threshold = 60000; // 1 min

    constructor(@inject(TYPES.activeInstanceAuthority) activeInstanceAuthority: ActiveInstanceAuthority) {
        this.activeInstanceAuthority = activeInstanceAuthority;
    }

    public run(): void {
        this.timer = setInterval(() => {
            const instances: Map<string, ActiveInstanceInterface> = this.activeInstanceAuthority.getAllInstances();

            instances.forEach((instance: ActiveInstanceInterface) => {
                const expectedDuration: number = MetagameUtils.getMetagameDuration(instance.metagameEventType);
                const expectedEndTimestamp: number = (instance.timeStarted.getTime() + expectedDuration) + this.threshold;
                const diff = Date.now() - (expectedEndTimestamp * 1000); // If POSITIVE, overdue

                if (diff > 0) {
                    try {
                        OverdueInstanceAuthority.logger.warn(`Instance ${instance.instanceId} on world ${instance.world} is OVERDUE by ${diff}, ending!`);
                        void this.activeInstanceAuthority.endInstance(instance);
                    } catch (err) {
                        OverdueInstanceAuthority.logger.error(`Overdue instance ${instance.instanceId} was unable to be forcefully ended! It is now ${diff} seconds overdue!`);
                    }
                }
            });
        }, 60000);
    }

    public stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}
