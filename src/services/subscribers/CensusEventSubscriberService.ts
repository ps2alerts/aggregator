import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {inject, injectable} from 'inversify';
import {Client} from 'ps2census';
import {TYPES} from '../../constants/types';
// Events
import DeathEvent from '../../handlers/census/events/DeathEvent';
import MetagameEventEvent from '../../handlers/census/events/MetagameEventEvent';
import FacilityControlEvent from '../../handlers/census/events/FacilityControlEvent';
import InstanceHandlerInterface from '../../interfaces/InstanceHandlerInterface';
import PlayerLoginEvent from '../../handlers/census/events/PlayerLoginEvent';
import PlayerLogoutEvent from '../../handlers/census/events/PlayerLogoutEvent';
// Handlers
import DeathEventHandler from '../../handlers/census/DeathEventHandler';
import MetagameEventEventHandler from '../../handlers/census/MetagameEventEventHandler';
import PlayerLoginEventHandler from '../../handlers/census/PlayerLoginEventHandler';
import PlayerLogoutEventHandler from '../../handlers/census/PlayerLogoutEventHandler';
import FacilityControlEventHandler from '../../handlers/census/FacilityControlEventHandler';
import GainExperienceEventHandler from '../../handlers/census/GainExperienceEventHandler';
import CharacterPresenceHandlerInterface from '../../interfaces/CharacterPresenceHandlerInterface';
// Other
import {CharacterBrokerInterface} from '../../interfaces/CharacterBrokerInterface';
import PS2AlertsMetagameInstance from '../../instances/PS2AlertsMetagameInstance';

@injectable()
export default class CensusEventSubscriberService implements ServiceInterface {
    public readonly bootPriority = 10;

    private static readonly logger = getLogger('EventListenerService');

    private readonly wsClient: Client;
    private readonly deathEventHandler: DeathEventHandler;
    private readonly metagameEventEventHandler: MetagameEventEventHandler;
    private readonly playerLoginEventHandler: PlayerLoginEventHandler;
    private readonly playerLogoutEventHandler: PlayerLogoutEventHandler;
    private readonly facilityControlEventHandler: FacilityControlEventHandler;
    private readonly gainExperienceEventHandler: GainExperienceEventHandler;
    private readonly instanceHandler: InstanceHandlerInterface;
    private readonly characterPresenceHandler: CharacterPresenceHandlerInterface;
    private readonly characterBroker: CharacterBrokerInterface;

    constructor(
        wsClient: Client,
        deathEventHandler: DeathEventHandler,
        metagameEventEventHandler: MetagameEventEventHandler,
        playerLoginEventHandler: PlayerLoginEventHandler,
        playerLogoutEventHandler: PlayerLogoutEventHandler,
        facilityControlEventHandler: FacilityControlEventHandler,
        gainExperienceEventHandler: GainExperienceEventHandler,
        @inject(TYPES.instanceHandlerInterface) instanceHandler: InstanceHandlerInterface,
        @inject(TYPES.characterPresenceHandlerInterface) characterPresenceHandler: CharacterPresenceHandlerInterface,
        @inject(TYPES.characterBrokerInterface) characterBroker: CharacterBrokerInterface,
    ) {
        this.wsClient = wsClient;
        this.deathEventHandler = deathEventHandler;
        this.metagameEventEventHandler = metagameEventEventHandler;
        this.playerLoginEventHandler = playerLoginEventHandler;
        this.playerLogoutEventHandler = playerLogoutEventHandler;
        this.facilityControlEventHandler = facilityControlEventHandler;
        this.gainExperienceEventHandler = gainExperienceEventHandler;
        this.instanceHandler = instanceHandler;
        this.characterPresenceHandler = characterPresenceHandler;
        this.characterBroker = characterBroker;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        CensusEventSubscriberService.logger.debug('Booting EventListenerService...');

        this.constructListeners();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async start(): Promise<void> {
        CensusEventSubscriberService.logger.debug('Starting EventListenerService... (NOT IMPLEMENTED)');
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async terminate(): Promise<void> {
        CensusEventSubscriberService.logger.debug('Terminating Census Stream Service!');
    }

    private static handleCharacterException(service: string, message: string): void {
        if (
            message.includes('No data found') ||
            message.includes('api returned no matches for') ||
            message.includes('No character ID was supplied!')
        ) {
            CensusEventSubscriberService.logger.warn(`Unable to process ${service} event! W: ${message}`);
        } else {
            CensusEventSubscriberService.logger.error(`Unable to process ${service} event! E: ${message}`);
        }
    }

    // Here we pass all the events
    private constructListeners(): void {

        // Set up event handlers
        this.wsClient.on('death', (event) => {
            CensusEventSubscriberService.logger.silly('Passing Death to listener');

            void Promise.all([
                this.characterBroker.get(event.attacker_character_id),
                this.characterBroker.get(event.character_id),
            ]).then(([attacker, character]) => {
                [attacker, character].forEach((char) => {
                    void this.characterPresenceHandler.update(
                        char,
                        parseInt(event.zone_id, 10),
                    );
                });

                const instances = this.instanceHandler.getInstances(
                    parseInt(event.world_id, 10),
                    parseInt(event.zone_id, 10),
                );

                instances.forEach((instance) => {
                    const deathEvent = new DeathEvent(
                        event,
                        instance,
                        attacker,
                        character,
                    );
                    void this.deathEventHandler.handle(deathEvent);
                });
            }).catch((e) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                CensusEventSubscriberService.handleCharacterException('Death', e.message);
            });
        });

        this.wsClient.on('facilityControl', (event) => {
            const instances = this.instanceHandler.getInstances(
                parseInt(event.world_id, 10),
                parseInt(event.zone_id, 10),
            );

            instances.forEach((instance) => {
                let delay = 1;

                if (instance instanceof PS2AlertsMetagameInstance) {
                    delay = 2000;
                }

                setTimeout(() => {
                    CensusEventSubscriberService.logger.silly('Passing FacilityControl to listener');
                    const facilityControl = new FacilityControlEvent(
                        event,
                        instance,
                    );
                    void this.facilityControlEventHandler.handle(facilityControl);
                }, delay);
            });
        });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.wsClient.on('gainExperience', async (event) => {
            const character = await this.characterBroker.get(event.character_id)
                .catch((e) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    CensusEventSubscriberService.handleCharacterException('GainExperience', e.message);
                });

            if (!character) {
                return;
            }

            await this.characterPresenceHandler.update(
                character,
                parseInt(event.zone_id, 10),
            );
        });

        this.wsClient.on('metagameEvent', (event) => {
            CensusEventSubscriberService.logger.debug('Passing MetagameEvent to listener');

            try {
                const metagameEvent = new MetagameEventEvent(event);
                void this.metagameEventEventHandler.handle(metagameEvent);
            } catch (e) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                CensusEventSubscriberService.logger.error(e.message);
            }

        });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.wsClient.on('playerLogin', async (event) => {
            CensusEventSubscriberService.logger.silly('Passing PlayerLogin to listener');
            const character = await this.characterBroker.get(event.character_id)
                .catch((e) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    CensusEventSubscriberService.handleCharacterException('PlayerLogin', e.message);
                });

            if (!character) {
                return;
            }

            const playerLoginEvent = new PlayerLoginEvent(event, character);
            await this.playerLoginEventHandler.handle(playerLoginEvent);
        });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.wsClient.on('playerLogout', async (event) => {
            CensusEventSubscriberService.logger.silly('Passing PlayerLogout to listener');
            const character = await this.characterBroker.get(event.character_id)
                .catch((e) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    CensusEventSubscriberService.handleCharacterException('PlayerLogout', e.message);
                });

            if (!character) {
                return;
            }

            const playerLogoutEvent = new PlayerLogoutEvent(event, character);
            await this.playerLogoutEventHandler.handle(playerLogoutEvent);
        });
    }
}
