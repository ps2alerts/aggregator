import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {inject, injectable} from 'inversify';
import {Client} from 'ps2census';
import DeathEventHandler from '../../handlers/census/DeathEventHandler';
import MetagameEventEventHandler from '../../handlers/census/MetagameEventEventHandler';
import PlayerLoginEventHandler from '../../handlers/census/PlayerLoginEventHandler';
import PlayerLogoutEventHandler from '../../handlers/census/PlayerLogoutEventHandler';
import ContinentLockEventHandler from '../../handlers/census/ContinentLockEventHandler';
import FacilityControlEventHandler from '../../handlers/census/FacilityControlEventHandler';
import GainExperienceEventHandler from '../../handlers/census/GainExperienceEventHandler';
import AchievementEarnedHandler from '../../handlers/census/AchievementEarnedHandler';
import BattleRankUpHandler from '../../handlers/census/BattleRankUpHandler';
import PlayerFacilityCaptureHandler from '../../handlers/census/PlayerFacilityCaptureHandler';
import PlayerFacilityDefendHandler from '../../handlers/census/PlayerFacilityDefendHandler';
import ContinentUnlockHandler from '../../handlers/census/ContinentUnlockHandler';
import {TYPES} from '../../constants/types';
import DeathEvent from '../../handlers/census/events/DeathEvent';
import MetagameEventEvent from '../../handlers/census/events/MetagameEventEvent';
import FacilityControlEvent from '../../handlers/census/events/FacilityControlEvent';
import InstanceHandlerInterface from '../../interfaces/InstanceHandlerInterface';
import PlayerLoginEvent from '../../handlers/census/events/PlayerLoginEvent';
import PlayerLogoutEvent from '../../handlers/census/events/PlayerLogoutEvent';
import CharacterPresenceHandlerInterface from '../../interfaces/CharacterPresenceHandlerInterface';
import {CharacterBrokerInterface} from '../../interfaces/CharacterBrokerInterface';

@injectable()
export default class CensusEventSubscriberService implements ServiceInterface {
    public readonly bootPriority = 10;

    private static readonly logger = getLogger('EventListenerService');

    private readonly wsClient: Client;
    private readonly deathEventHandler: DeathEventHandler;
    private readonly metagameEventEventHandler: MetagameEventEventHandler;
    private readonly playerLoginEventHandler: PlayerLoginEventHandler;
    private readonly playerLogoutEventHandler: PlayerLogoutEventHandler;
    private readonly continentLockHandler: ContinentLockEventHandler;
    private readonly facilityControlEventHandler: FacilityControlEventHandler;
    private readonly gainExperienceEventHandler: GainExperienceEventHandler;
    private readonly achievementEarnedHandler: AchievementEarnedHandler;
    private readonly battleRankUpHandler: BattleRankUpHandler;
    private readonly playerFacilityCapture: PlayerFacilityCaptureHandler;
    private readonly playerFacilityDefend: PlayerFacilityDefendHandler;
    private readonly continentUnlockHandler: ContinentUnlockHandler;
    private readonly instanceHandler: InstanceHandlerInterface;
    private readonly characterPresenceHandler: CharacterPresenceHandlerInterface;
    private readonly characterBroker: CharacterBrokerInterface;

    constructor(
        wsClient: Client,
        deathEventHandler: DeathEventHandler,
        metagameEventEventHandler: MetagameEventEventHandler,
        playerLoginEventHandler: PlayerLoginEventHandler,
        playerLogoutEventHandler: PlayerLogoutEventHandler,
        continentLockHandler: ContinentLockEventHandler,
        facilityControlEventHandler: FacilityControlEventHandler,
        gainExperienceEventHandler: GainExperienceEventHandler,
        achievementEarnedHandler: AchievementEarnedHandler,
        battleRankUpHandler: BattleRankUpHandler,
        playerFacilityCapture: PlayerFacilityCaptureHandler,
        playerFacilityDefend: PlayerFacilityDefendHandler,
        continentUnlockHandler: ContinentUnlockHandler,
        @inject(TYPES.instanceHandlerInterface) instanceHandler: InstanceHandlerInterface,
        @inject(TYPES.characterPresenceHandlerInterface) characterPresenceHandler: CharacterPresenceHandlerInterface,
        @inject(TYPES.characterBrokerInterface) characterBroker: CharacterBrokerInterface,
    ) {
        this.wsClient = wsClient;
        this.deathEventHandler = deathEventHandler;
        this.metagameEventEventHandler = metagameEventEventHandler;
        this.playerLoginEventHandler = playerLoginEventHandler;
        this.playerLogoutEventHandler = playerLogoutEventHandler;
        this.continentLockHandler = continentLockHandler;
        this.facilityControlEventHandler = facilityControlEventHandler;
        this.gainExperienceEventHandler = gainExperienceEventHandler;
        this.achievementEarnedHandler = achievementEarnedHandler;
        this.battleRankUpHandler = battleRankUpHandler;
        this.playerFacilityCapture = playerFacilityCapture;
        this.playerFacilityDefend = playerFacilityDefend;
        this.continentUnlockHandler = continentUnlockHandler;
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

        // this.destructHandlers();
    }

    // Here we pass all the events
    private constructListeners(): void {

        // Set up event handlers
        this.wsClient.on('death', (event) => {
            CensusEventSubscriberService.logger.silly('Passing Death to listener');

            [event.character_id, event.attacker_character_id].forEach((id) => {
                void this.characterPresenceHandler.update(
                    id,
                    parseInt(event.world_id, 10),
                    parseInt(event.zone_id, 10),
                );
            });

            const instances = this.instanceHandler.getInstances(
                parseInt(event.world_id, 10),
                parseInt(event.zone_id, 10),
            );

            // Yes, the below does fetch the char data twice if there's >1 instance, however since the 2nd run will be pulled from redis, meh.
            instances.forEach((instance) => {
                void Promise.all([
                    /* eslint-disable */
                    this.characterBroker.get(event.attacker_character_id),
                    this.characterBroker.get(event.character_id),
                    /* eslint-enable */
                ]).then(([attacker, character]) => {
                    const deathEvent = new DeathEvent(
                        event,
                        instance,
                        attacker,
                        character,
                    );
                    void this.deathEventHandler.handle(deathEvent);
                });
            });
        });

        this.wsClient.on('facilityControl', (event) => {
            const instances = this.instanceHandler.getInstances(
                parseInt(event.world_id, 10),
                parseInt(event.zone_id, 10),
            );

            instances.forEach((instance) => {
                CensusEventSubscriberService.logger.debug('Passing FacilityControl to listener');
                const facilityControl = new FacilityControlEvent(
                    event,
                    instance,
                );
                void this.facilityControlEventHandler.handle(facilityControl);
            });
        });

        this.wsClient.on('gainExperience', (event) => {
            void this.characterPresenceHandler.update(
                event.character_id,
                parseInt(event.world_id, 10),
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
                CensusEventSubscriberService.logger.warn(e.message);
            }

        });

        this.wsClient.on('playerLogin', (event) => {
            CensusEventSubscriberService.logger.silly('Passing PlayerLogin to listener');
            const playerLoginEvent = new PlayerLoginEvent(event);
            void this.playerLoginEventHandler.handle(playerLoginEvent);
        });

        this.wsClient.on('playerLogout', (event) => {
            CensusEventSubscriberService.logger.silly('Passing PlayerLogout to listener');
            const playerLogoutEvent = new PlayerLogoutEvent(event);
            void this.playerLogoutEventHandler.handle(playerLogoutEvent);
        });
    }
}
