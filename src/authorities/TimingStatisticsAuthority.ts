import {getLogger} from '../logger';
import Redis from 'ioredis';
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
    private readonly eventTypes = ['Death', 'FacilityControl', 'GainExperience', 'VehicleDestroy'];

    constructor(
        private readonly cacheClient: Redis,
    ) {}

    public async run(): Promise<void> {
        if (this.timer) {
            TimingStatisticsAuthority.logger.warn('Attempted to run TimingStatisticsAuthority timer when already defined!');
            this.stop();
        }

        // Wipe all metrics lists so 1) we don't have any dangling lists from previous runs and 2) stats are wiped
        const keys = await this.cacheClient.smembers(config.redis.metricsListKey);

        if (keys.length) {
            for (const key of keys) {
                await this.cacheClient.del(key);
                await this.cacheClient.srem(config.redis.metricsListKey, key);
            }
        }

        // Add this run's keys in so the next run can flush them
        for (const eventType of this.eventTypes) {
            const listKey = `metrics-messages-${eventType}-${this.runId}`;
            await this.cacheClient.sadd(config.redis.metricsListKey, listKey);
        }

        TimingStatisticsAuthority.logger.debug(`${keys.length} metrics keys cleared!`);

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.timer = setInterval(async () => {
            let show = false;

            const tableData: TableDisplayInterface[] = [];

            for (const eventType of this.eventTypes) {
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

                // Check if there's actually something to show
                if (count > 0) {
                    show = true;
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

            if (show) {
                TimingStatisticsAuthority.logger.debug('Message Metrics:');

                if (TimingStatisticsAuthority.logger.isDebugEnabled()) {
                    console.table(tableData);
                }
            }
        }, 60000);

        TimingStatisticsAuthority.logger.debug('Created TimingStatisticsAuthority timer');
    }

    public stop(): void {
        TimingStatisticsAuthority.logger.debug('Clearing TimingStatisticsAuthority timer');

        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}
