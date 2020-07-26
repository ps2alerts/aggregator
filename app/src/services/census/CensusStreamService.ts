// @See https://github.com/microwavekonijn/ps2census for further commands (wsClient)

import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {inject, injectable} from 'inversify';
import {Client, MetagameEvent, PS2Event} from 'ps2census';
import {getUnixTimestamp} from '../../utils/time';
import {World} from '../../constants/world';
import {MetagameEventIds} from '../../constants/metagameEventIds';
import Census from '../../config/census';

@injectable()
export default class CensusStreamService implements ServiceInterface {
    private static readonly logger = getLogger('ps2census');

    private readonly wsClient: Client;

    private readonly config: Census;

    private lastMessage: Date = new Date();

    private messageTimer: NodeJS.Timeout | null;

    constructor(
        wsClient: Client,
        @inject('censusConfig') censusConfig: Census,
    ) {
        this.wsClient = wsClient;
        this.config = censusConfig;
        this.prepareClient();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        CensusStreamService.logger.info('Booting Census Stream Service... (NOT IMPLEMENTED)');
    }

    public async start(): Promise<void> {
        CensusStreamService.logger.info('Starting Census Stream Service...');
        await this.wsClient.watch();
    }

    public terminate(): void {
        CensusStreamService.logger.info('Terminating Census Stream Service!');

        try {
            this.messageTimer = null;
            this.wsClient.destroy();
        } catch {
            // Fucked
        }
    }

    private prepareClient(): void {
        this.wsClient.on('ready', () => {
            CensusStreamService.logger.info('Census Stream Service connected, but not yet subscribed.');
        });

        this.wsClient.on('reconnecting', () => {
            CensusStreamService.logger.warn('Census stream connection lost... reconnecting...');
        });

        this.wsClient.on('disconnected', () => {
            CensusStreamService.logger.error('Census stream connection disconnected!');
        });

        this.wsClient.on('error', (error: Error) => {
            CensusStreamService.logger.error(`Census stream error! ${error.message}`);
        });

        this.wsClient.on('warn', (error: Error) => {
            CensusStreamService.logger.warn(`Census stream warn! ${error.message}`);
        });

        this.wsClient.on('debug', (message: string) => {
            CensusStreamService.logger.info(`Census stream debug: ${message}`);
        });

        this.wsClient.on('duplicate', (event: PS2Event) => {
            CensusStreamService.logger.warn(`Census stream duplicate detected: ${event.event_name}`);
        });

        this.wsClient.on('ps2Event', () => {
            this.lastMessage = new Date();
        });

        this.wsClient.on('subscribed', () => {
            CensusStreamService.logger.info('Census stream subscribed!');
            this.startMessageTimer();

            // The below injects a metagame event start on a World and Zone of your choosing, so you don't have to wait.
            // REVERT THIS FROM VERSION CONTROL ONCE YOU'RE DONE
            if (this.config.enableInjections) {
                /* eslint-disable */
                const event = new MetagameEvent(this.wsClient, {
                    event_name: 'MetagameEvent',
                    experience_bonus: '25.000000',
                    faction_nc: '6.274510',
                    faction_tr: '19.607843',
                    faction_vs: '9.803922',
                    instance_id: String(Math.floor(Math.random() * 100000) + 1),
                    metagame_event_id: String(MetagameEventIds.MELTDOWN_AMERISH),
                    metagame_event_state: '137',
                    metagame_event_state_name: 'started',
                    timestamp: String(getUnixTimestamp()),
                    world_id: String(World.MILLER),
                });
                /* eslint-enable */
                // this.wsClient.emit(Events.PS2_META_EVENT, event);
                CensusStreamService.logger.debug('Emitted Metagame Start event');
            }
        });
    }

    private startMessageTimer(): void {
        CensusStreamService.logger.info('Census message timer started');

        this.messageTimer = setInterval(() => {
            CensusStreamService.logger.debug('Census message timeout check running...');
            const now = new Date();
            const lastMessageThreshold = now.getTime() - 300000; // 5 minutes ago

            if (this.lastMessage.getTime() < lastMessageThreshold) {
                CensusStreamService.logger.error('NO CENSUS MESSAGES RECEIVED IN THE LAST 5 MINUTES, KICKING CONNECTION IN THE NUTS');
                void this.wsClient.watch();
            }
        }, 60000);
    }
}
