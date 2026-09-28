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
    private collecting = false;
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

        await this.gatherRedisMetrics();

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.metricsTimer = setInterval(async () => {
            if (this.collecting) {
                return; // A slow scan skips a tick rather than overlapping it
            }

            this.collecting = true;

            try {
                await this.gatherRedisMetrics();
            } catch (err) {
                MetricsAuthority.logger.error(`Unable to gather Redis metrics! Err: ${(err as Error).message}`);
            } finally {
                this.collecting = false;
            }
        }, this.metricsTime);

        MetricsAuthority.logger.debug('Created MetricsAuthority timers');
    }

    public stop(): void {
        MetricsAuthority.logger.debug('Clearing MetricsAuthority timers');

        if (this.metricsTimer) {
            clearInterval(this.metricsTimer);
        }
    }

    private async gatherRedisMetrics() {
        // Character, presence and participant keys are shared, so every aggregator reports the same count for them.
        // One SCAN pass: KEYS per family blocked Redis for a full pass each time.
        const prefixes: Record<string, string> = {
            cache_character: 'cache:character:',
            cache_item: `cache:item:${this.censusEnvironment}:`,
            cache_facility_data: `cache:facilityData:${this.censusEnvironment}:`,
            character_presence: 'characterPresence:',
            outfit_participants: 'outfitParticipants:',
        };
        const keys = new Set<string>(); // SCAN can return a key more than once

        for await (const batch of this.cacheClient.scanStream({count: 1000})) {
            (batch as string[]).forEach((key) => keys.add(key));
        }

        const counts = Object.fromEntries(Object.keys(prefixes).map((type) => [type, 0]));

        keys.forEach((key) => {
            const type = Object.keys(prefixes).find((t) => key.startsWith(prefixes[t]));

            if (type) {
                counts[type]++;
            }
        });

        // Each is one set key; these count the IDs inside it
        counts.unknown_item_ids = await this.cacheClient.scard(`unknownItems:${this.censusEnvironment}`);
        counts.unknown_facility_ids = await this.cacheClient.scard(`unknownFacilities:${this.censusEnvironment}`);

        Object.entries(counts).forEach(([type, count]) => {
            this.metricsHandler.setGauge(METRICS_NAMES.CACHE_KEYS_GAUGE, count, {type});
        });

        // Create these series at zero so alerts on them have data; adding 0 must not count a real error
        ['/character', '/map', '/item'].forEach((endpoint) => {
            this.metricsHandler.increaseCounter(METRICS_NAMES.EXTERNAL_REQUESTS_COUNT, {provider: 'census', endpoint, result: METRIC_VALUES.ERROR}, 0);
        });
    }
}
