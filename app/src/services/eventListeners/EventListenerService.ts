import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {injectable} from 'inversify';
import {Client} from 'ps2census';
import DeathEventHandler from '../../handlers/census/DeathEventHandler';
import WorldValidator from '../../validators/WorldValidator';
import ActiveAlertAuthorityInterface from '../../interfaces/ActiveAlertAuthorityInterface';
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
import DeathEvent from '../../handlers/census/events/DeathEvent';
import ActiveAlertInterface from '../../interfaces/ActiveAlertInterface';
import {PS2ZoneEvents} from '../../types/PS2AlertsEvent';
import MetagameEventEvent from '../../handlers/census/events/MetagameEventEvent';
import ActiveAlertAuthority from '../../authorities/ActiveAlertAuthority';

@injectable()
export default class EventListenerService implements ServiceInterface {
    private static readonly logger = getLogger('EventListenerService');

    private readonly wsClient: Client;
    private readonly worldCheck: WorldValidator;
    private readonly activeAlerts: ActiveAlertAuthorityInterface;
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
    private readonly coninentUnlockHandler: ContinentUnlockHandler;

    constructor(
        wsClient: Client,
        worldCheck: WorldValidator,
        activeAlertAuthority: ActiveAlertAuthority,
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
    ) {
        this.wsClient = wsClient;
        this.worldCheck = worldCheck;
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
        this.coninentUnlockHandler = continentUnlockHandler;
        this.activeAlerts = activeAlertAuthority;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        EventListenerService.logger.info('Booting EventListenerService... (NOT IMPLEMENTED)');
    }

    public async start(): Promise<void> {
        EventListenerService.logger.info('Starting EventListenerService...');
        // eslint-disable-next-line @typescript-eslint/await-thenable
        void await this.constructListeners();
    }

    public terminate(): void {
        EventListenerService.logger.info('Terminating Census Stream Service!');

        // this.destructHandlers();
    }

    private constructListeners(): void {
        // Set up event handlers
        this.wsClient.on('death', (event) => {
            const deathEvent = new DeathEvent(event, this.injectAlert(event));
            void this.deathEventHandler.handle(deathEvent);
        });

        this.wsClient.on('metagameEvent', (event) => {
            EventListenerService.logger.debug('Passing metagame event to listener');
            const metagameEvent = new MetagameEventEvent(event);
            void this.metagameEventEventHandler.handle(metagameEvent);
        });
    }

    private injectAlert(event: PS2ZoneEvents): ActiveAlertInterface {
        return this.activeAlerts.getAlert(
            parseInt(event.world_id, 10),
            parseInt(event.zone_id, 10),
        );
    }
}
