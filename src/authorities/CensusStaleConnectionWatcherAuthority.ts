import {injectable} from 'inversify';
import {getLogger} from '../logger';
import {World} from '../constants/world';
import {CensusClient, PS2Event} from 'ps2census';
import {CensusEnvironment} from '../types/CensusEnvironment';
import LocalServerTimeCalculator from '../calculators/LocalServerTimeCalculator';
import config from '../config';

@injectable()
export default class CensusStaleConnectionWatcherAuthority {
    private static readonly logger = getLogger('CensusStaleConnectionWatcherAuthority');
    private readonly environment: CensusEnvironment;
    private deathMessageTimer?: NodeJS.Timeout;
    private experienceMessageTimer?: NodeJS.Timeout;
    private killConnectionTimer?: NodeJS.Timeout;
    private refreshConnectionTimer?: NodeJS.Timeout;
    private readonly checkInterval = 15000;
    private readonly refreshInterval = (60 * 15) * 1000;
    private readonly lastMessagesDeathMap: Map<World, number> = new Map<World, number>();
    private readonly lastMessagesExperienceMap: Map<World, number> = new Map<World, number>();
    private needToResub = false;

    constructor(
        private readonly censusClient: CensusClient,
    ) {
        this.environment = config.census.censusEnvironment;
    }

    public run(): void {
        this.needToResub = false;

        if (this.deathMessageTimer || this.experienceMessageTimer || this.killConnectionTimer || this.refreshConnectionTimer) {
            CensusStaleConnectionWatcherAuthority.logger.warn(`[${this.environment}] Attempted to run CensusStaleConnectionWatcherAuthority timers when already defined!`);
            this.stop();
        }

        CensusStaleConnectionWatcherAuthority.logger.debug(`[${this.environment}] Creating CensusStaleConnectionWatcherAuthority timer`);

        this.deathMessageTimer = setInterval(() => {
            CensusStaleConnectionWatcherAuthority.logger.silly(`[${this.environment}] Census Death message timeout check running...`);
            this.checkMap(this.lastMessagesDeathMap, this.censusClient.environment === 'ps2' ? 60000 : 120000, 'Death');
        }, this.checkInterval);

        this.experienceMessageTimer = setInterval(() => {
            CensusStaleConnectionWatcherAuthority.logger.silly(`[${this.environment}] Census Experience message timeout check running...`);
            this.checkMap(this.lastMessagesExperienceMap, this.censusClient.environment === 'ps2' ? 30000 : 60000, 'Experience');
        }, this.checkInterval);

        this.killConnectionTimer = setInterval(() => {
            if (this.needToResub) {
                CensusStaleConnectionWatcherAuthority.logger.error(`[${this.environment} Census connection was marked to be restarted, doing so now...`);

                void this.censusClient.resubscribe();
            }
        }, 5000);

        this.refreshConnectionTimer = setInterval(() => {
            if (this.needToResub) {
                CensusStaleConnectionWatcherAuthority.logger.info(`[${this.environment} Refreshing Census connection...`);

                void this.censusClient.resubscribe();
            }
        }, this.refreshInterval);
    }

    public stop(): void {
        CensusStaleConnectionWatcherAuthority.logger.debug(`[${this.environment}] Clearing CensusStaleConnectionWatcherAuthority timer`);

        if (this.deathMessageTimer) {
            clearInterval(this.deathMessageTimer);
        }

        if (this.experienceMessageTimer) {
            clearInterval(this.experienceMessageTimer);
        }

        if (this.killConnectionTimer) {
            clearInterval(this.killConnectionTimer);
        }

        if (this.refreshConnectionTimer) {
            clearInterval(this.refreshConnectionTimer);
        }

        this.lastMessagesDeathMap.clear();
        this.lastMessagesExperienceMap.clear();
    }

    public updateLastMessage(event: PS2Event): void {
        let map = null;

        if (event.event_name === 'Death') {
            map = this.lastMessagesDeathMap;
        } else if (event.event_name === 'GainExperience') {
            map = this.lastMessagesExperienceMap;
        } else {
            return;
        }

        map.set(parseInt(event.world_id, 10), Date.now());
    }

    private checkMap(map: Map<World, number>, thresholdLimit: number, type: string): void {
        if (map.size === 0) {
            CensusStaleConnectionWatcherAuthority.logger.error(`[${this.environment}] ZERO census messages have come through for type ${type}! Marking connection for reboot.`);
            this.needToResub = true;
            return;
        }

        map.forEach((lastTime: number, world: World) => {
            const threshold: number = Date.now() - thresholdLimit;

            // If the bracket for the world is dead, disregard the world as chances are there's nothing going on
            const localServerHour = new LocalServerTimeCalculator(
                world,
                new Date(),
            ).calculate();

            // If between 09:00-23:59
            if (localServerHour >= 9 && lastTime < threshold) {
                CensusStaleConnectionWatcherAuthority.logger.error(`[${this.environment}] No Census ${type} messages received on world ${world} within expected threshold of ${thresholdLimit / 1000} seconds. Assuming dead subscription. Marking connection for reboot.`);
                this.needToResub = true;
            }
        });
    }
}
