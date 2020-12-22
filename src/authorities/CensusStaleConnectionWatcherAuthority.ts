import {injectable} from 'inversify';
import {getLogger} from '../logger';
import {World} from '../constants/world';
import {Client, PS2Event} from 'ps2census';
import {CensusEnvironment} from '../types/CensusEnvironment';

@injectable()
export default class CensusStaleConnectionWatcherAuthority {
    private static readonly logger = getLogger('CensusStaleConnectionWatcherAuthority');
    private readonly wsClient: Client;
    private readonly environment: CensusEnvironment;
    private deathMessageTimer?: NodeJS.Timeout;
    private experienceMessageTimer?: NodeJS.Timeout;
    private readonly checkInterval = 15000;
    private readonly lastMessagesDeathMap: Map<World, number> = new Map<World, number>();
    private readonly lastMessagesExperienceMap: Map<World, number> = new Map<World, number>();

    constructor(
        wsClient: Client,
        environment: CensusEnvironment,
    ) {
        this.wsClient = wsClient;
        this.environment = environment;
    }

    public run(): void {
        if (this.deathMessageTimer || this.experienceMessageTimer) {
            CensusStaleConnectionWatcherAuthority.logger.warn(`[${this.environment}] Attempted to run CensusStaleConnectionWatcherAuthority timers when already defined!`);
            this.stop();
        }

        CensusStaleConnectionWatcherAuthority.logger.debug(`[${this.environment}] Creating CensusStaleConnectionWatcherAuthority timer`);

        this.deathMessageTimer = setInterval(() => {
            CensusStaleConnectionWatcherAuthority.logger.silly(`[${this.environment}] Census Death message timeout check running...`);
            this.checkMap(this.lastMessagesDeathMap, 60000, 'Death');
        }, this.checkInterval);

        this.experienceMessageTimer = setInterval(() => {
            CensusStaleConnectionWatcherAuthority.logger.silly(`[${this.environment}] Census Experience message timeout check running...`);
            this.checkMap(this.lastMessagesExperienceMap, 30000, 'Experience');
        }, this.checkInterval);
    }

    public stop(): void {
        CensusStaleConnectionWatcherAuthority.logger.debug(`[${this.environment}] Clearing CensusStaleConnectionWatcherAuthority timer`);

        if (this.deathMessageTimer) {
            clearInterval(this.deathMessageTimer);
        }

        if (this.experienceMessageTimer) {
            clearInterval(this.experienceMessageTimer);
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
            CensusStaleConnectionWatcherAuthority.logger.error(`[${this.environment}] ZERO census messages have come through for type ${type}! Killing connection!`);
            void this.wsClient.resubscribe();
        }

        map.forEach((lastTime: number, world: World) => {
            const threshold: number = Date.now() - thresholdLimit;

            if (lastTime < threshold) {
                CensusStaleConnectionWatcherAuthority.logger.error(`[${this.environment}] No Census ${type} messages received on world ${world} within expected threshold of ${thresholdLimit / 1000} seconds. Assuming dead subscription. Rebooting Connection.`);
                void this.wsClient.resubscribe();
            }
        });
    }
}
