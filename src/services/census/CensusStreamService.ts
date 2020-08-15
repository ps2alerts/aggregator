// @See https://github.com/microwavekonijn/ps2census for further commands (wsClient)

import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {inject, injectable} from 'inversify';
import {Client, Events, MetagameEvent, PS2Event} from 'ps2census';
import {getUnixTimestamp} from '../../utils/time';
import {World} from '../../constants/world';
import {MetagameEventType} from '../../constants/metagameEventType';
import Census from '../../config/census';
import OverdueInstanceAuthority from '../../authorities/OverdueInstanceAuthority';
import {TYPES} from '../../constants/types';
import InstanceHandlerInterface from '../../interfaces/InstanceHandlerInterface';
import PopulationAuthority from '../../authorities/PopulationAuthority';
import CharacterPresenceHandlerInterface from '../../interfaces/CharacterPresenceHandlerInterface';
import {jsonLogOutput} from '../../utils/json';

@injectable()
export default class CensusStreamService implements ServiceInterface {
    public readonly bootPriority = 11;

    private static readonly logger = getLogger('ps2census');

    private readonly wsClient: Client;

    private readonly config: Census;

    private readonly lastMessagesMap: Map<World, number> = new Map<World, number>();

    private messageTimer?: NodeJS.Timeout;

    private readonly overdueInstanceAuthority: OverdueInstanceAuthority;

    private readonly instanceHandler: InstanceHandlerInterface;

    private readonly characterPresenceHandler: CharacterPresenceHandlerInterface;

    private readonly populationAuthority: PopulationAuthority;

    constructor(
        wsClient: Client,
        @inject('censusConfig') censusConfig: Census,
        @inject(TYPES.overdueInstanceAuthority) overdueInstanceAuthority: OverdueInstanceAuthority,
        @inject(TYPES.instanceHandlerInterface) instanceHandler: InstanceHandlerInterface,
        @inject(TYPES.characterPresenceHandlerInterface) characterPresenceHandler: CharacterPresenceHandlerInterface,
        @inject(TYPES.populationAuthority) populationAuthority: PopulationAuthority,
    ) {
        this.wsClient = wsClient;
        this.config = censusConfig;
        this.overdueInstanceAuthority = overdueInstanceAuthority;
        this.instanceHandler = instanceHandler;
        this.characterPresenceHandler = characterPresenceHandler;
        this.populationAuthority = populationAuthority;
        this.prepareClient();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        CensusStreamService.logger.debug('Booting Census Stream Service...');

        await Promise.all([
            this.instanceHandler.init(),
            this.characterPresenceHandler.init(),
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
            if (!message.includes('Reset heartbeat') && !message.includes('Heartbeat acknowledged')) {
                CensusStreamService.logger.debug(`Census stream debug: ${message}`);
            }
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

        this.wsClient.on('subscribed', (subscriptions) => {
            CensusStreamService.logger.info('Census stream subscribed! Subscriptons:');
            CensusStreamService.logger.info(jsonLogOutput(subscriptions));
            this.startMessageTimer();
            this.overdueInstanceAuthority.run();
            this.populationAuthority.run();

            // The below injects a metagame event start on a World and Zone of your choosing, so you don't have to wait.
            // REVERT THIS FROM VERSION CONTROL ONCE YOU'RE DONE
            if (this.config.enableInjections) {
                /* eslint-disable */
                const instanceId = String(Math.floor(Math.random() * 100000) + 1)
                const alertStartEvent = new MetagameEvent(this.wsClient, {
                    event_name: 'MetagameEvent',
                    experience_bonus: '25.000000',
                    faction_nc: '6.274510',
                    faction_tr: '19.607843',
                    faction_vs: '9.803922',
                    instance_id: instanceId,
                    metagame_event_id: String(MetagameEventType.AMERISH_ENLIGHTENMENT),
                    metagame_event_state: '137',
                    metagame_event_state_name: 'started',
                    timestamp: String(getUnixTimestamp()),
                    world_id: String(World.MILLER),
                });
                /* eslint-enable */
                this.wsClient.emit(Events.PS2_META_EVENT, alertStartEvent);
                CensusStreamService.logger.debug('Emitted Metagame Start event');
            }
        });
    }

    private startMessageTimer(): void {
        CensusStreamService.logger.info('Census message timer started');

        this.messageTimer = setInterval(() => {
            CensusStreamService.logger.debug('Census message timeout check running...');

            this.lastMessagesMap.forEach((lastTime: number, world: World) => {
                const thresholdLimit = 120000;
                const threshold: number = Date.now() - thresholdLimit; // We expect to get at least one death event on every world, regardless of time within 120 seconds

                if (lastTime < threshold) {
                    CensusStreamService.logger.error(`No Census Death messages received on world ${world} within expected threshold of ${thresholdLimit / 1000} seconds. Assuming dead subscription. Rebooting Connection.`);
                    void this.wsClient.resubscribe();
                }
            });
        }, 15000);
    }
}
