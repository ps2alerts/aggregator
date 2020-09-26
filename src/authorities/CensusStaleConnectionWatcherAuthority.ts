import {injectable} from 'inversify';
import {getLogger} from '../logger';
import {World} from '../constants/world';
import {Client, PS2Event} from 'ps2census';

@injectable()
export default class CensusStaleConnectionWatcherAuthority {
    private static readonly logger = getLogger('CensusStaleConnectionWatcherAuthority');
    private deathMessageTimer?: NodeJS.Timeout;
    private experienceMessageTimer?: NodeJS.Timeout;
    private readonly checkInterval = 15000;
    private readonly lastMessagesDeathMap: Map<World, number> = new Map<World, number>();
    private readonly lastMessagesExperienceMap: Map<World, number> = new Map<World, number>();
    private wsClient: Client;

    public run(client: Client): void {
        if (this.deathMessageTimer) {
            CensusStaleConnectionWatcherAuthority.logger.warn('Attempted to run CensusStaleConnectionWatcherAuthority timer when already defined!');
            this.stop();
        }

        this.wsClient = client;

        CensusStaleConnectionWatcherAuthority.logger.debug('Creating CensusStaleConnectionWatcherAuthority timer');

        this.deathMessageTimer = setInterval(() => {
            CensusStaleConnectionWatcherAuthority.logger.silly('Census Death message timeout check running...');
            this.checkMap(this.lastMessagesDeathMap, 60000, 'Death');
        }, this.checkInterval);

        this.experienceMessageTimer = setInterval(() => {
            CensusStaleConnectionWatcherAuthority.logger.silly('Census Experience message timeout check running...');
            this.checkMap(this.lastMessagesExperienceMap, 15000, 'Experience');
        }, this.checkInterval);
    }

    public stop(): void {
        CensusStaleConnectionWatcherAuthority.logger.debug('Clearing CensusStaleConnectionWatcherAuthority timer');

        if (this.deathMessageTimer) {
            clearInterval(this.deathMessageTimer);
        }

        if (this.experienceMessageTimer) {
            clearInterval(this.experienceMessageTimer);
        }
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
        map.forEach((lastTime: number, world: World) => {
            const threshold: number = Date.now() - thresholdLimit;

            if (lastTime < threshold) {
                CensusStaleConnectionWatcherAuthority.logger.error(`No Census ${type} messages received on world ${world} within expected threshold of ${thresholdLimit / 1000} seconds. Assuming dead subscription. Rebooting Connection.`);
                void this.wsClient.resubscribe();
            }
        });
    }
}
