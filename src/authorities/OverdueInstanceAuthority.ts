import {Injectable, Logger} from '@nestjs/common';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import InstanceAuthority from './InstanceAuthority';
import MetricsHandler from '../handlers/MetricsHandler';
import {METRICS_NAMES} from '../modules/metrics/MetricsConstants';

@Injectable()
export default class OverdueInstanceAuthority {
    private static readonly logger = new Logger('OverdueInstanceAuthority');
    private timer?: NodeJS.Timeout;

    constructor(
        private readonly instanceAuthority: InstanceAuthority,
        private readonly metricsHandler: MetricsHandler,
    ) {}

    public run(): void {
        if (this.timer) {
            OverdueInstanceAuthority.logger.warn('Attempted to run OverdueInstanceAuthority timer when already defined!');
            this.stop();
        }

        this.timer = setInterval(() => {
            OverdueInstanceAuthority.logger.verbose('Running OverdueInstanceAuthority overdue alert check');

            // Get all instances, update the gauges, then perform operations
            const instances = this.instanceAuthority.getAllInstances();

            this.metricsHandler.setGauge(METRICS_NAMES.INSTANCES_GAUGE, instances.length, {type: 'active'});

            const overdueInstances = instances.filter((instance) => {
                return instance.overdue();
            });
            this.metricsHandler.setGauge(METRICS_NAMES.INSTANCES_GAUGE, overdueInstances.length, {type: 'overdue'});
            overdueInstances.forEach((instance: PS2AlertsInstanceInterface) => {
                try {
                    OverdueInstanceAuthority.logger.warn(`Instance ${instance.instanceId} on world ${instance.world} is OVERDUE! Ending!`);
                    this.metricsHandler.increaseCounter(METRICS_NAMES.INSTANCES_COUNT, {type: 'overdue'});

                    void this.instanceAuthority.endInstance(instance);
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
