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
export default class CensusEventSubscriberService implements ServiceInterface {
    private static readonly logger = getLogger('EventListenerService');

    private readonly wsClient: Client;
    private readonly worldCheck: WorldValidator;
    private readonly activeAlerts: ActiveAlertAuthority;
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
        CensusEventSubscriberService.logger.info('Booting EventListenerService... (NOT IMPLEMENTED)');
    }

    public async start(): Promise<void> {
        CensusEventSubscriberService.logger.info('Starting EventListenerService...');
        // eslint-disable-next-line @typescript-eslint/await-thenable
        void await this.constructListeners();
    }

    public terminate(): void {
        CensusEventSubscriberService.logger.info('Terminating Census Stream Service!');

        // this.destructHandlers();
    }

    // Here we pass all the events
    private constructListeners(): void {

        // Set up event handlers
        this.wsClient.on('death', (event) => {
            if (this.checkAlert(event)) {
                const deathEvent = new DeathEvent(event, this.getAlert(event));
                void this.deathEventHandler.handle(deathEvent);
            }
        });

        // this.wsClient.on('facilityControl', (event) => {
        //     if (!this.getAlert(event)) {
        //         return false;
        //     }
        //
        //     EventListenerService.logger.debug('Passing FacilityControl to listener');
        //     const facilityControl = new FacilityControlEvent(event, this.getAlert(event));
        //     void this.facilityControlEventHandler.handle(facilityControl);
        // });

        this.wsClient.on('metagameEvent', (event) => {
            CensusEventSubscriberService.logger.debug('Passing MetagameEvent to listener');
            const metagameEvent = new MetagameEventEvent(event);
            void this.metagameEventEventHandler.handle(metagameEvent);
        });
    }

    private checkAlert(event: PS2ZoneEvents): boolean {
        return this.activeAlerts.alertExists(
            parseInt(event.world_id, 10),
            parseInt(event.zone_id, 10),
        );
    }

    // Checks for compatible event types to see if alert is running on that World + Zone combo
    private getAlert(event: PS2ZoneEvents): ActiveAlertInterface {
        return this.activeAlerts.getAlert(
            parseInt(event.world_id, 10),
            parseInt(event.zone_id, 10),
        );
    }
}
