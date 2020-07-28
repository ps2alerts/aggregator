// @See https://github.com/microwavekonijn/ps2census for further commands (wsClient)

import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {inject, injectable} from 'inversify';
import {Client, Events, MetagameEvent, PS2Event} from 'ps2census';
import {getUnixTimestamp} from '../../utils/time';
import {World} from '../../constants/world';
import {MetagameEventIds} from '../../constants/metagameEventIds';
import Census from '../../config/census';

@injectable()
export default class CensusStreamService implements ServiceInterface {
    public readonly bootPriority = 10;

    private static readonly logger = getLogger('ps2census');

    private readonly wsClient: Client;

    private readonly config: Census;

    private readonly lastMessagesMap: Map<World, number> = new Map<World, number>();

    private messageTimer?: NodeJS.Timeout;

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
        CensusStreamService.logger.debug('Booting Census Stream Service... (NOT IMPLEMENTED)');
    }

    public async start(): Promise<void> {
        CensusStreamService.logger.debug('Starting Census Stream Service...');
        await this.wsClient.watch();
    }

    public terminate(): void {
        CensusStreamService.logger.debug('Terminating Census Stream Service!');

        try {
            if (this.messageTimer) {
                clearInterval(this.messageTimer);
            }

            this.wsClient.destroy();
        } catch {
            // Fucked
        }
    }

    private prepareClient(): void {
        this.wsClient.on('ready', () => {
            CensusStreamService.logger.debug('Census Stream Service connected, but not yet subscribed.');
        });

        this.wsClient.on('reconnecting', () => {
            if (this.messageTimer) {
                clearInterval(this.messageTimer);
            }

            CensusStreamService.logger.warn('Census stream connection lost... reconnecting...');
        });

        this.wsClient.on('disconnected', () => {
            if (this.messageTimer) {
                clearInterval(this.messageTimer);
            }

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

        this.wsClient.on('ps2Event', (event: PS2Event) => {
            // If the event name is a monitored event type, add the current Date to the array.
            if (event.event_name === 'Death' && parseInt(event.world_id, 10) !== World.JAEGER) {
                this.lastMessagesMap.set(parseInt(event.world_id, 10), Date.now());
            }
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
                this.wsClient.emit(Events.PS2_META_EVENT, event);
                CensusStreamService.logger.debug('Emitted Metagame Start event');
            }
        });
    }

    private startMessageTimer(): void {
        CensusStreamService.logger.info('Census message timer started');

        this.messageTimer = setInterval(() => {
            CensusStreamService.logger.debug('Census message timeout check running...');

            this.lastMessagesMap.forEach((lastTime: number, world: World) => {
                const thresholdLimit = 60000;
                const threshold: number = Date.now() - thresholdLimit; // We expect to get at least one death event on every world, regarless of time within 60 seconds

                if (lastTime < threshold) {
                    CensusStreamService.logger.error(`No Census Death messages received on world ${world} within expected threshold of ${thresholdLimit / 1000} seconds. Assuming dead subscription. Rebooting Connection.`);
                    void this.wsClient.resubscribe();
                }
            });
        }, 15000);
    }
}
