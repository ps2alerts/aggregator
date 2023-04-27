// noinspection JSUnusedLocalSymbols
import Redis from 'ioredis';
import {Injectable, Logger} from '@nestjs/common';
import MetricsHandler from '../handlers/MetricsHandler';
import {ConfigService} from '@nestjs/config';
import {METRIC_VALUES, METRICS_NAMES} from '../modules/metrics/MetricsConstants';

@Injectable()
export default class MetricsAuthority {
    private static readonly logger = new Logger('MetricsAuthority');
    private readonly runId: number;
    private metricsTimer?: NodeJS.Timeout;
    private readonly metricsTime = 15000;
    private readonly censusEnvironment: string;

    constructor(
        private readonly cacheClient: Redis,
        config: ConfigService,
        private readonly metricsHandler: MetricsHandler,
    ) {
        this.runId = config.get('app.runId');
        this.censusEnvironment = config.getOrThrow('census.environment');
    }

    public async run(): Promise<void> {
        if (this.metricsTimer) {
            MetricsAuthority.logger.warn('Attempted to run MetricsAuthority metricsTimer when already defined!');
            this.stop();
        }

        this.setDefaults();
        await this.gatherRedisMetrics();

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.metricsTimer = setInterval(async () => {
            await this.gatherRedisMetrics();
        }, this.metricsTime);

        MetricsAuthority.logger.debug('Created MetricsAuthority timers');
    }

    public stop(): void {
        MetricsAuthority.logger.debug('Clearing MetricsAuthority timers');

        if (this.metricsTimer) {
            clearInterval(this.metricsTimer);
        }
    }

    // Always set these metrics up on runtime otherwise it makes graphs and alerts go wonky
    private setDefaults() {
        this.metricsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'character', result: METRIC_VALUES.CACHE_MISS});
        this.metricsHandler.increaseCounter(METRICS_NAMES.CACHE_HITMISS_COUNT, {type: 'item', result: METRIC_VALUES.CACHE_MISS});
        this.metricsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'item', result: METRIC_VALUES.CACHE_MISS});
        this.metricsHandler.increaseCounter(METRICS_NAMES.CACHE_HITMISS_COUNT, {type: 'item', result: METRIC_VALUES.CACHE_MISS});
        this.metricsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'facility_data', result: METRIC_VALUES.CACHE_MISS});
        this.metricsHandler.increaseCounter(METRICS_NAMES.CACHE_HITMISS_COUNT, {type: 'facility_data', result: METRIC_VALUES.CACHE_MISS});
    }

    private async gatherRedisMetrics() {
        // Total up the number of keys currently in various caches
        const promises = [
            await this.cacheClient.keys('cache:character:*'),
            await this.cacheClient.keys(`cache:item:${this.censusEnvironment}:*`),
            await this.cacheClient.keys(`cache:facilityData:${this.censusEnvironment}:*`),
            await this.cacheClient.smembers(`unknownItems:${this.censusEnvironment}`),
            await this.cacheClient.smembers(`unknownFacilities:${this.censusEnvironment}`),
            await this.cacheClient.keys('characterPresence:*'),
            await this.cacheClient.keys('outfitParticipants:*'),
        ];

        await Promise.all(promises).then((results) => {
            this.metricsHandler.setGauge(METRICS_NAMES.CACHE_KEYS_GAUGE, results[0].length, {type: 'cache_character'});
            this.metricsHandler.setGauge(METRICS_NAMES.CACHE_KEYS_GAUGE, results[1].length, {type: 'cache_item'});
            this.metricsHandler.setGauge(METRICS_NAMES.CACHE_KEYS_GAUGE, results[2].length, {type: 'cache_facility_data'});
            this.metricsHandler.setGauge(METRICS_NAMES.CACHE_KEYS_GAUGE, results[3].length, {type: 'unknown_items'});
            this.metricsHandler.setGauge(METRICS_NAMES.CACHE_KEYS_GAUGE, results[4].length, {type: 'unknown_facilities'});
            this.metricsHandler.setGauge(METRICS_NAMES.CACHE_KEYS_GAUGE, results[5].length, {type: 'character_presence'});
            this.metricsHandler.setGauge(METRICS_NAMES.CACHE_KEYS_GAUGE, results[6].length, {type: 'outfit_participants'});
        });
    }
}
