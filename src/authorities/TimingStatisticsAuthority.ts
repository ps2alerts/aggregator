import Redis from 'ioredis';
import {Injectable, Logger} from '@nestjs/common';
import config from '../config';
import {MetricTypes} from '../handlers/StatisticsHandler';

interface TableDisplayInterface {
    metricType: string;
    count: number;
    avgCountSec: string;
    avgMs: string;
    minMs: number;
    maxMs: number;
}

@Injectable()
export default class TimingStatisticsAuthority {
    private static readonly logger = new Logger('TimingStatisticsAuthority');
    private readonly runId = config.app.runId;
    private readonly metricsListKey = 'metrics:list';
    private timer?: NodeJS.Timeout;
    private readonly displayTime = 60000;

    constructor(
        private readonly cacheClient: Redis,
    ) {}

    public async run(): Promise<void> {
        if (this.timer) {
            TimingStatisticsAuthority.logger.warn('Attempted to run TimingStatisticsAuthority timer when already defined!');
            this.stop();
        }

        // Wipe all metrics lists, so we don't have any dangling lists from previous runs
        const keys = await this.cacheClient.smembers(this.metricsListKey);

        if (keys.length) {
            for (const key of keys) {
                await this.cacheClient.del(key);
                await this.cacheClient.srem(this.metricsListKey, key);
            }
        }

        // Add this run's keys in so the next run can flush them
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [key, metricType] of Object.entries(MetricTypes)) {
            const listKey = `metrics:${this.runId}:${metricType}`;
            await this.cacheClient.sadd(this.metricsListKey, listKey);
        }

        TimingStatisticsAuthority.logger.debug(`${keys.length} metrics keys cleared!`);

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.timer = setInterval(async () => {
            let show = false;

            const tableData: TableDisplayInterface[] = [];

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [key, metricType] of Object.entries(MetricTypes)) {
                const key = `metrics:${this.runId}:${metricType}`;
                const length = await this.cacheClient.llen(key);
                const timings = await this.cacheClient.lrange(key, 0, length);

                let count = 0;
                let timeSum = 0;
                let avgCountSec = 0;
                let avgTime = 0;
                let min = 0;
                let max = 0;

                for (const timeString of timings) {
                    const time = parseInt(timeString, 10);
                    // Calculate things
                    count++;
                    timeSum += time;
                    avgCountSec = count / 60;
                    avgTime = timeSum / count;

                    if (min === 0) {
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
                    metricType,
                    count,
                    avgCountSec: avgCountSec.toFixed(2),
                    avgMs: avgTime.toFixed(2),
                    minMs: min,
                    maxMs: max,
                });

                // Flush the list so everything resets
                await this.cacheClient.del(key);
            }

            if (show && config.logger.levels.includes('debug')) {
                TimingStatisticsAuthority.logger.debug(`Message Metrics for ${this.displayTime / 1000}s:`);
                console.table(tableData);
            } else if (!show) {
                TimingStatisticsAuthority.logger.debug('No metrics to show!');
            }
        }, this.displayTime);

        TimingStatisticsAuthority.logger.debug('Created TimingStatisticsAuthority timer');
    }

    public stop(): void {
        TimingStatisticsAuthority.logger.debug('Clearing TimingStatisticsAuthority timer');

        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}
