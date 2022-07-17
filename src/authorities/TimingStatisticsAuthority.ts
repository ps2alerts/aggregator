import {getLogger} from '../logger';
import {Redis} from 'ioredis';
import {injectable} from 'inversify';
import config from '../config';

interface TableDisplayInterface {
    eventType: string;
    count: number;
    avgCountSec: string;
    avgTime: string;
    min: string;
    max: string;
}

@injectable()
export default class TimingStatisticsAuthority {
    private static readonly logger = getLogger('TimingStatisticsAuthority');
    private readonly runId = config.app.runId;
    private timer?: NodeJS.Timeout;

    constructor(
        private readonly cacheClient: Redis,
    ) {}

    public run(): void {
        if (this.timer) {
            TimingStatisticsAuthority.logger.warn('Attempted to run TimingStatisticsAuthority timer when already defined!');
            this.stop();
        }

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.timer = setInterval(async () => {
            TimingStatisticsAuthority.logger.debug('Message Metrics:');

            const eventTypes = ['Death', 'FacilityControl', 'GainExperience', 'MetagameEvent', 'VehicleDestroy'];

            const tableData: TableDisplayInterface[] = [];

            for (const eventType of eventTypes) {
                const key = `metrics-messages-${eventType}-${this.runId}`;
                const length = await this.cacheClient.llen(key);
                const timings = await this.cacheClient.lrange(key, 0, length);

                let count = 0;
                let timeSum = 0;
                let avgCountSec = 0;
                let avgTime = 0;
                let min = -1;
                let max = 0;

                for (const timeString of timings) {
                    const time = parseInt(timeString, 10);
                    // Calculate things
                    count++;
                    timeSum += time;
                    avgCountSec = count / 60;
                    avgTime = timeSum / count;

                    if (min === -1) {
                        min = time;
                    }

                    if (time < min) {
                        min = time;
                    }

                    if (time > max) {
                        max = time;
                    }
                }

                tableData.push({
                    eventType,
                    count,
                    avgCountSec: avgCountSec.toFixed(2),
                    avgTime: (avgTime / 1000).toFixed(2),
                    min: (min / 1000).toFixed(2),
                    max: (max / 1000).toFixed(2),
                });

                // Flush the list so everything resets
                await this.cacheClient.del(key);
            }

            if (TimingStatisticsAuthority.logger.isDebugEnabled()) {
                // eslint-disable-next-line no-console
                console.table(tableData);
            }
        }, 30000);

        TimingStatisticsAuthority.logger.debug('Created TimingStatisticsAuthority timer');
    }

    public stop(): void {
        TimingStatisticsAuthority.logger.debug('Clearing TimingStatisticsAuthority timer');

        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}
