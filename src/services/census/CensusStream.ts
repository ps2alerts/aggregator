import {getLogger} from '../../logger';
import {injectable} from 'inversify';
import {CensusClient, PS2Event} from 'ps2census';
import {World} from '../../constants/world';
import CensusEventSubscriber from './CensusEventSubscriber';
import CensusStaleConnectionWatcherAuthority from '../../authorities/CensusStaleConnectionWatcherAuthority';
import {jsonLogOutput} from '../../utils/json';
import {CensusEnvironment} from '../../types/CensusEnvironment';

@injectable()
export default class CensusStream {
    private static readonly logger = getLogger('ps2census');

    constructor(
        public readonly wsClient: CensusClient,
        public readonly environment: CensusEnvironment,
        private readonly censusEventSubscriber: CensusEventSubscriber,
        private readonly censusStaleConnectionWatcherAuthority: CensusStaleConnectionWatcherAuthority,
    ) {}

    public async bootClient(): Promise<void> {
        CensusStream.logger.info(`[${this.environment}] Booting Census Stream...`);

        await this.wsClient.watch();

        this.wsClient.on('subscribed', (subscriptions) => {
            CensusStream.logger.info(`[${this.environment}] Census stream subscribed! Subscriptions:`);
            CensusStream.logger.info(jsonLogOutput(subscriptions));
            this.censusStaleConnectionWatcherAuthority.run();
            this.censusEventSubscriber.constructListeners();
        });

        this.wsClient.on('reconnecting', () => {
            this.censusStaleConnectionWatcherAuthority.stop();
            CensusStream.logger.warn(`[${this.environment}] Census stream connection lost... reconnecting...`);
        });

        this.wsClient.on('disconnected', () => {
            this.censusStaleConnectionWatcherAuthority.stop();
            CensusStream.logger.error(`[${this.environment}] Census stream connection disconnected!`);
        });

        this.wsClient.on('error', (error: Error) => {
            CensusStream.logger.error(`[${this.environment}] Census stream error! ${error.message}`);
        });

        this.wsClient.on('warn', (error: Error) => {
            CensusStream.logger.warn(`[${this.environment}] Census stream warn! ${error.message}`);
        });

        this.wsClient.on('debug', (message: string) => {
            if (
                !message.includes('Reset heartbeat') &&
                !message.includes('Heartbeat acknowledged') &&
                !message.includes('CharacterManager')
            ) {
                CensusStream.logger.silly(`[${this.environment}] Census stream debug: ${message}`);
            }
        });

        this.wsClient.on('duplicate', (event: PS2Event) => {
            if (
                !event.event_name.indexOf('Death') &&
                !event.event_name.indexOf('PlayerLogin') &&
                !event.event_name.indexOf('PlayerLogout')
            ) {
                CensusStream.logger.warn(`[${this.environment}] Census stream duplicate detected: ${event.event_name}`);
            }
        });

        this.wsClient.on('ps2Event', (event: PS2Event) => {
            const worldId = parseInt(event.world_id, 10);

            if ([World.JAEGER, World.EMERALD].includes(worldId)) {
                return true;
            }

            this.censusStaleConnectionWatcherAuthority.updateLastMessage(event);
        });
    }
}
