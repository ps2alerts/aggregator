import {injectable} from 'inversify';
import {getLogger} from '../logger';
import {World} from '../ps2alerts-constants/world';
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
    private connectionTimer?: NodeJS.Timeout;
    private subscriptionCheckTimer?: NodeJS.Timeout;
    private readonly checkInterval = 15000;
    private readonly subscriptionCheckInterval = 15 * 1000;
    private readonly lastMessagesDeathMap: Map<World, number> = new Map<World, number>();
    private readonly lastMessagesExperienceMap: Map<World, number> = new Map<World, number>();
    private needToResub = false;
    private needToReconnect = false;
    private resubCount = 0;
    private checkingSubscription = false;
    private skipVerification = false;

    constructor(
        private readonly censusClient: CensusClient,
    ) {
        this.environment = config.census.censusEnvironment;
    }

    public run(): void {
        this.needToResub = false;

        if (this.deathMessageTimer || this.experienceMessageTimer || this.connectionTimer || this.subscriptionCheckTimer) {
            CensusStaleConnectionWatcherAuthority.logger.warn(`[${this.environment}] Attempted to run CensusStaleConnectionWatcherAuthority timers when already defined!`);
            this.stop();
        }

        CensusStaleConnectionWatcherAuthority.logger.debug(`[${this.environment}] Creating CensusStaleConnectionWatcherAuthority timers`);

        this.deathMessageTimer = setInterval(() => {
            CensusStaleConnectionWatcherAuthority.logger.silly(`[${this.environment}] Census Death message timeout check running...`);
            this.checkMap(this.lastMessagesDeathMap, this.censusClient.environment === 'ps2' ? 60000 : 120000, 'Death');
        }, this.checkInterval);

        this.experienceMessageTimer = setInterval(() => {
            CensusStaleConnectionWatcherAuthority.logger.silly(`[${this.environment}] Census Experience message timeout check running...`);
            this.checkMap(this.lastMessagesExperienceMap, this.censusClient.environment === 'ps2' ? 30000 : 60000, 'Experience');
        }, this.checkInterval);

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.connectionTimer = setInterval(async () => {
            if (this.resubCount === 3) {
                CensusStaleConnectionWatcherAuthority.logger.error(`[${this.environment} Census Connection was marked for resub 3 times, forcing a reconnect!`);

                this.needToReconnect = true;
            }

            if (this.needToReconnect) {
                CensusStaleConnectionWatcherAuthority.logger.error(`[${this.environment} Census connection was marked to be reconnected, doing so now...`);
                this.needToResub = false;
                this.needToReconnect = false;
                this.skipVerification = true;

                this.censusClient.destroy();

                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                setTimeout(async () => {
                    await this.censusClient.watch();
                    this.resubCount = 0;
                    this.skipVerification = false;

                }, 500);
            }

            if (this.needToResub) {
                CensusStaleConnectionWatcherAuthority.logger.error(`[${this.environment} Census connection was marked to be resubscribed, doing so now...`);

                await this.censusClient.resubscribe(true);
                this.needToResub = false;
                this.resubCount++;
            }
        }, 1000);

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.subscriptionCheckTimer = setInterval(async () => {
            if (this.skipVerification) {
                return;
            }

            CensusStaleConnectionWatcherAuthority.logger.silly(`[${this.environment}] Census Subscription Check running...`);
            this.checkingSubscription = true;
            const validConnection = await this.censusClient.verifySubscription();

            if (!validConnection) {
                if (this.resubCount < 3) {
                    CensusStaleConnectionWatcherAuthority.logger.error('Census subscription is invalid, marking connection for resubbing!');
                    this.needToResub = true;
                } else {
                    CensusStaleConnectionWatcherAuthority.logger.error('Census subscription is invalid AND has happened 3 times.. Marking connection for reconnect!');
                    this.needToReconnect = true;
                }
            }

            setTimeout(() => {
                this.checkingSubscription = false;
            }, 1000);
        }, this.subscriptionCheckInterval);
    }

    public stop(): void {
        CensusStaleConnectionWatcherAuthority.logger.debug(`[${this.environment}] Clearing CensusStaleConnectionWatcherAuthority timer`);

        if (this.deathMessageTimer) {
            clearInterval(this.deathMessageTimer);
        }

        if (this.experienceMessageTimer) {
            clearInterval(this.experienceMessageTimer);
        }

        if (this.connectionTimer) {
            clearInterval(this.connectionTimer);
        }

        if (this.subscriptionCheckTimer) {
            clearInterval(this.subscriptionCheckTimer);
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

    public checking(): boolean {
        return this.checkingSubscription;
    }

    private checkMap(map: Map<World, number>, thresholdLimit: number, type: string): void {
        if (map.size === 0) {
            CensusStaleConnectionWatcherAuthority.logger.error(`[${this.environment}] ZERO census messages have come through for type ${type}! Marking connection for resub.`);
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
                CensusStaleConnectionWatcherAuthority.logger.error(`[${this.environment}] No Census ${type} messages received on world ${world} within expected threshold of ${thresholdLimit / 1000} seconds. Assuming dead subscription. Marking connection for resub.`);
                this.needToResub = true;
            }
        });
    }
}
