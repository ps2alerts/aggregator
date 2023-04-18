import Redis from 'ioredis';
import {Injectable, Logger} from '@nestjs/common';
import StatisticsHandler, {MetricTypes} from '../handlers/StatisticsHandler';
import {ConfigService} from '@nestjs/config';
import {METRICS_NAMES} from '../modules/monitoring/MetricsConstants';

interface TableDisplayInterface {
    metricType: string;
    count: number;
    failures: number | 'N/A' | '-';
    retries: number | 'N/A' | '-';
    avgCountSec: string;
    avgMs: string;
    minMs: number;
    maxMs: number;
}

@Injectable()
export default class MetricsAuthority {
    private static readonly logger = new Logger('TimingStatisticsAuthority');
    private readonly runId: number;
    private readonly metricsListKey = 'metrics:list';
    private timer?: NodeJS.Timeout;
    private metricsTimer?: NodeJS.Timeout;
    private readonly displayTime = 60000;
    private readonly metricsTime = 15000;

    constructor(
        private readonly cacheClient: Redis,
        config: ConfigService,
        private readonly statisticsHandler: StatisticsHandler,
    ) {
        this.runId = config.get('app.runId');
    }

    public async run(): Promise<void> {
        if (this.timer) {
            MetricsAuthority.logger.warn('Attempted to run TimingStatisticsAuthority timer when already defined!');
            this.stop();
        }

        if (this.metricsTimer) {
            MetricsAuthority.logger.warn('Attempted to run TimingStatisticsAuthority metricsTimer when already defined!');
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

        MetricsAuthority.logger.debug(`${keys.length} metrics keys cleared!`);

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.timer = setInterval(async () => {
            let show = false;

            const tableData: TableDisplayInterface[] = [];

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [key, metricType] of Object.entries(MetricTypes)) {
                const key = `metrics:${this.runId}:${metricType}`;
                const length = await this.cacheClient.llen(key);
                const entries = await this.cacheClient.lrange(key, 0, length);

                let count = 0;
                let successCount = 0;
                let retryCount = 0;
                let isFailNotApplicable = true;
                let isRetryNotApplicable = true;
                let timeSum = 0;
                let avgCountSec = 0;
                let avgTime = 0;
                let min = 0;
                let max = 0;

                for (const entry of entries) {
                    // Explode the string as it's comma separated
                    const stats = entry.split(','); // e.g. 1244,1 or 155,N/A
                    const duration = parseInt(stats[0], 10);
                    const isSuccess = stats[1] === 'N/A' ? 'N/A' : parseInt(stats[1], 10) === 1;
                    const isRetry = stats[2] === 'N/A' ? 'N/A' : parseInt(stats[2], 10) === 1;

                    if (isSuccess !== 'N/A') {
                        isFailNotApplicable = false;
                    }

                    if (isRetry !== 'N/A') {
                        isRetryNotApplicable = false;
                    }

                    // Calculate things
                    count++;
                    successCount = isFailNotApplicable ? 0 : successCount + 1;
                    retryCount = isRetryNotApplicable ? 0 : retryCount + 1;
                    timeSum += duration;
                    avgCountSec = count / 60;
                    avgTime = timeSum / count;

                    if (min === 0) {
                        min = duration;
                    }

                    if (duration < min) {
                        min = duration;
                    }

                    if (duration > max) {
                        max = duration;
                    }
                }

                // Check if there's actually something to show
                if (count > 0) {
                    show = true;
                }

                tableData.push({
                    metricType,
                    count,
                    failures: count === 0 ? '-' : isFailNotApplicable ? 'N/A' : count - successCount,
                    retries: count === 0 ? '-' : isRetryNotApplicable ? 'N/A' : count - retryCount,
                    avgCountSec: avgCountSec.toFixed(2),
                    avgMs: avgTime.toFixed(2),
                    minMs: min,
                    maxMs: max,
                });

                // Flush the list so everything resets
                await this.cacheClient.del(key);
            }

            if (show) {
                MetricsAuthority.logger.debug(`Message Metrics for ${this.displayTime / 1000}s:`);
                console.table(tableData);
            } else {
                MetricsAuthority.logger.debug('No metrics to show!');
            }

        }, this.displayTime);

        await this.enumerateCacheMetrics();

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.metricsTimer = setInterval(async () => {
            await this.enumerateCacheMetrics();
        }, this.metricsTime);

        MetricsAuthority.logger.debug('Created TimingStatisticsAuthority timers');
    }

    public stop(): void {
        MetricsAuthority.logger.debug('Clearing TimingStatisticsAuthority timers');

        if (this.timer) {
            clearInterval(this.timer);
        }

        if (this.metricsTimer) {
            clearInterval(this.metricsTimer);
        }
    }

    private async enumerateCacheMetrics() {
        // Total up the number of keys currently in various caches
        const characterCacheKeys = await this.cacheClient.keys('cache:character:*');
        const itemCacheKeys = await this.cacheClient.keys('cache:item:*');
        const unknownItemKeys = await this.cacheClient.keys('unknownItems:*');
        this.statisticsHandler.setGauge(METRICS_NAMES.CACHE_GAUGE, characterCacheKeys.length, {type: 'character_total'});
        this.statisticsHandler.setGauge(METRICS_NAMES.CACHE_GAUGE, itemCacheKeys.length, {type: 'item_total'});
        this.statisticsHandler.setGauge(METRICS_NAMES.CACHE_GAUGE, unknownItemKeys.length, {type: 'unknown_items'});
    }
}
