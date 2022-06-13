import {getLogger} from '../../logger';
import {injectable} from 'inversify';
import {CensusClient, PS2Event} from 'ps2census';
import {World} from '../../constants/world';
import CensusEventSubscriber from './CensusEventSubscriber';
import CensusStaleConnectionWatcherAuthority from '../../authorities/CensusStaleConnectionWatcherAuthority';
import {jsonLogOutput} from '../../utils/json';
import {CensusEnvironment} from '../../types/CensusEnvironment';
import config from '../../config';

@injectable()
export default class CensusStream {
    public readonly environment: CensusEnvironment = config.census.censusEnvironment;

    private static readonly logger = getLogger('CensusStream');

    constructor(
        public readonly censusClient: CensusClient,
        private readonly censusEventSubscriber: CensusEventSubscriber,
        private readonly censusStaleConnectionWatcherAuthority: CensusStaleConnectionWatcherAuthority,
    ) {}

    public async bootClient(): Promise<void> {
        CensusStream.logger.info(`[${this.environment}] Booting Census Stream...`);

        await this.censusClient.watch();

        this.censusClient.on('subscribed', (subscriptions) => {
            if (this.censusStaleConnectionWatcherAuthority.checking()) {
                return;
            }

            CensusStream.logger.info(`[${this.environment}] Census stream subscribed! Subscriptions:`);
            CensusStream.logger.info(jsonLogOutput(subscriptions));

            if (config.census.staleConnectionWatcherEnabled) {
                this.censusStaleConnectionWatcherAuthority.run();
            } else {
                CensusStream.logger.debug('Census stale connection watcher is DISABLED!');
            }

            this.censusEventSubscriber.constructListeners();
        });

        this.censusClient.on('reconnecting', () => {
            this.censusStaleConnectionWatcherAuthority.stop();
            CensusStream.logger.warn(`[${this.environment}] Census stream connection reconnecting...`);
        });

        this.censusClient.on('disconnected', () => {
            this.censusStaleConnectionWatcherAuthority.stop();
            CensusStream.logger.error(`[${this.environment}] Census stream connection disconnected!`);
        });

        this.censusClient.on('error', (error: Error) => {
            CensusStream.logger.error(`[${this.environment}] Census stream error! ${error.message}`);
        });

        this.censusClient.on('warn', (error: Error) => {
            CensusStream.logger.warn(`[${this.environment}] Census stream warning! ${error.message}`);
        });

        // If debug isn't possible (as in it's production) ignore this completely as it's pointless and it's done on EVERY message
        if (CensusStream.logger.isDebugEnabled()) {
            this.censusClient.on('debug', (message: string) => {
                if (
                    !message.includes('Reset heartbeat') &&
                    !message.includes('Heartbeat acknowledged') &&
                    !message.includes('CharacterManager') &&
                    !message.includes('from Census')
                ) {
                    CensusStream.logger.debug(`[${this.environment}] Census stream debug: ${message}`);
                }
            });
        }

        this.censusClient.on('duplicate', (event: PS2Event) => {
            if (
                !event.event_name.indexOf('Death') &&
                !event.event_name.indexOf('PlayerLogin') &&
                !event.event_name.indexOf('PlayerLogout')
            ) {
                CensusStream.logger.warn(`[${this.environment}] Census stream duplicate detected: ${event.event_name}`);
            }
        });

        this.censusClient.on('ps2Event', (event: PS2Event) => {
            const worldId = parseInt(event.world_id, 10);

            if ([World.JAEGER].includes(worldId)) {
                return true;
            }

            this.censusStaleConnectionWatcherAuthority.updateLastMessage(event);
        });
    }
}
