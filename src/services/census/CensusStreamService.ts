// @See https://github.com/microwavekonijn/ps2census for further commands (wsClient)

import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {inject, injectable} from 'inversify';
import {Client, PS2Event} from 'ps2census';
import {World} from '../../constants/world';
import Census from '../../config/census';
import OverdueInstanceAuthority from '../../authorities/OverdueInstanceAuthority';
import {TYPES} from '../../constants/types';
import InstanceHandlerInterface from '../../interfaces/InstanceHandlerInterface';
import PopulationAuthority from '../../authorities/PopulationAuthority';
import CharacterPresenceHandlerInterface from '../../interfaces/CharacterPresenceHandlerInterface';
import {jsonLogOutput} from '../../utils/json';
import CensusStaleConnectionWatcherAuthority from '../../authorities/CensusStaleConnectionWatcherAuthority';

@injectable()
export default class CensusStreamService implements ServiceInterface {
    public readonly bootPriority = 11;
    private static readonly logger = getLogger('ps2census');
    private readonly wsClient: Client;
    private readonly config: Census;
    private readonly overdueInstanceAuthority: OverdueInstanceAuthority;
    private readonly instanceHandler: InstanceHandlerInterface;
    private readonly characterPresenceHandler: CharacterPresenceHandlerInterface;
    private readonly populationAuthority: PopulationAuthority;
    private readonly censusStaleConnectionWatcherAuthority: CensusStaleConnectionWatcherAuthority;

    constructor(
        wsClient: Client,
        @inject('censusConfig') censusConfig: Census,
        @inject(TYPES.overdueInstanceAuthority) overdueInstanceAuthority: OverdueInstanceAuthority,
        @inject(TYPES.instanceHandlerInterface) instanceHandler: InstanceHandlerInterface,
        @inject(TYPES.characterPresenceHandlerInterface) characterPresenceHandler: CharacterPresenceHandlerInterface,
        @inject(TYPES.populationAuthority) populationAuthority: PopulationAuthority,
        @inject(TYPES.censusStaleConnectionWatcherAuthority) censusStaleConnectionWatcherAuthority: CensusStaleConnectionWatcherAuthority,
    ) {
        this.wsClient = wsClient;
        this.config = censusConfig;
        this.overdueInstanceAuthority = overdueInstanceAuthority;
        this.instanceHandler = instanceHandler;
        this.characterPresenceHandler = characterPresenceHandler;
        this.populationAuthority = populationAuthority;
        this.censusStaleConnectionWatcherAuthority = censusStaleConnectionWatcherAuthority;
        this.prepareClient();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        CensusStreamService.logger.debug('Booting Census Stream Service...');

        await Promise.all([
            this.instanceHandler.init(),
        ]);
    }

    public async start(): Promise<void> {
        CensusStreamService.logger.debug('Starting Census Stream Service...');

        await this.wsClient.watch();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async terminate(): Promise<void> {
        CensusStreamService.logger.debug('Terminating Census Stream Service!');

        try {
            this.censusStaleConnectionWatcherAuthority.stop();
            this.wsClient.destroy();
        } catch {
            // Fucked
        }
    }

    public getClient(): Client {
        return this.wsClient;
    }

    private prepareClient(): void {
        this.wsClient.on('ready', () => {
            CensusStreamService.logger.debug('Census Stream Service connected, but not yet subscribed.');
        });

        this.wsClient.on('reconnecting', () => {
            this.censusStaleConnectionWatcherAuthority.stop();
            CensusStreamService.logger.warn('Census stream connection lost... reconnecting...');
        });

        this.wsClient.on('disconnected', () => {
            this.censusStaleConnectionWatcherAuthority.stop();
            this.overdueInstanceAuthority.stop();
            this.populationAuthority.stop();

            CensusStreamService.logger.error('Census stream connection disconnected!');
        });

        this.wsClient.on('error', (error: Error) => {
            CensusStreamService.logger.error(`Census stream error! ${error.message}`);
        });

        this.wsClient.on('warn', (error: Error) => {
            CensusStreamService.logger.warn(`Census stream warn! ${error.message}`);
        });

        this.wsClient.on('debug', (message: string) => {
            if (
                !message.includes('Reset heartbeat') &&
                !message.includes('Heartbeat acknowledged') &&
                !message.includes('CharacterManager')
            ) {
                CensusStreamService.logger.silly(`Census stream debug: ${message}`);
            }
        });

        this.wsClient.on('duplicate', (event: PS2Event) => {
            if (
                !event.event_name.indexOf('Death') &&
                !event.event_name.indexOf('PlayerLogin') &&
                !event.event_name.indexOf('PlayerLogout')
            ) {
                CensusStreamService.logger.warn(`Census stream duplicate detected: ${event.event_name}`);
            }
        });

        this.wsClient.on('ps2Event', (event: PS2Event) => {
            if (parseInt(event.world_id, 10) !== World.JAEGER) {
                return true;
            }

            this.censusStaleConnectionWatcherAuthority.updateLastMessage(event);
        });

        this.wsClient.on('subscribed', (subscriptions) => {
            CensusStreamService.logger.info('Census stream subscribed! Subscriptions:');
            CensusStreamService.logger.info(jsonLogOutput(subscriptions));
            this.censusStaleConnectionWatcherAuthority.run(this.wsClient);
            this.overdueInstanceAuthority.run();
            this.populationAuthority.run();
        });
    }
}
