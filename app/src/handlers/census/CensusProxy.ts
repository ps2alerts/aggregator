import WorldValidator from '../../validators/WorldValidator';
import {GenericEvent} from 'ps2census/dist/client/utils/PS2Events';
import {injectable} from 'inversify';
import DeathEventHandler from './DeathEventHandler';
import {getLogger} from '../../logger';
import config from '../../config';
import MetagameEventEventHandler from './MetagameEventEventHandler';
import PlayerLoginEventHandler from './PlayerLoginEventHandler';
import PlayerLogoutEventHandler from './PlayerLogoutEventHandler';
import ContinentLockEventHandler from './ContinentLockEventHandler';
import FacilityControlEventHandler from './FacilityControlEventHandler';

@injectable()
export default class CensusProxy {
    private static readonly logger = getLogger('CensusProxy');

    private readonly worldCheck: WorldValidator;
    private readonly deathEventHandler: DeathEventHandler;
    private readonly metagameEventEventHandler: MetagameEventEventHandler;
    private readonly playerLoginEventHandler: PlayerLoginEventHandler;
    private readonly playerLogoutEventHandler: PlayerLogoutEventHandler;
    private readonly continentLockHandler: ContinentLockEventHandler;
    private readonly facilityControlEventHandler: FacilityControlEventHandler;

    constructor(
        // TODO: make this into a single object parameter
        worldCheck: WorldValidator,
        deathEventHandler: DeathEventHandler,
        metagameEventEventHandler: MetagameEventEventHandler,
        playerLoginEventHandler: PlayerLoginEventHandler,
        playerLogoutEventHandler: PlayerLogoutEventHandler,
        continentLockHandler: ContinentLockEventHandler,
        facilityControlEventHandler: FacilityControlEventHandler,
    ) {
        this.worldCheck = worldCheck;
        this.deathEventHandler = deathEventHandler;
        this.metagameEventEventHandler = metagameEventEventHandler;
        this.playerLoginEventHandler = playerLoginEventHandler;
        this.playerLogoutEventHandler = playerLogoutEventHandler;
        this.continentLockHandler = continentLockHandler;
        this.facilityControlEventHandler = facilityControlEventHandler;
    }

    public handle(event: GenericEvent): boolean {
        if (config.features.logging.censusIncomingEvents) {
            CensusProxy.logger.debug(`INCOMING EVENT ${event.event_name}`);
        }

        // Validate if the message is relevant for what we want, e.g. worlds and zones with active alerts on.
        if (!this.worldCheck.validate(parseInt(event.world_id, 10))) {
            return false;
        }

        switch (event.event_name) {
            case 'AchievementEarned':
                // eventStore.storeAchievementEarned(payload);
                break;
            case 'BattleRankUp':
                // eventStore.storeBattleRankUp(payload);
                break;
            case 'Death':
                this.deathEventHandler.handle(event);
                break;
            case 'FacilityControl':
                this.facilityControlEventHandler.handle(event);
                break;
            case 'GainExperience':
                // eventStore.storeGainExperience(payload);
                break;
            case 'ItemAdded':
                // eventStore.storeItemAdded(payload);
                break;
            case 'MetagameEvent':
                this.metagameEventEventHandler.handle(event);
                break;
            case 'PlayerFacilityCapture':
                // eventStore.storePlayerFacilityCapture(payload);
                break;
            case 'PlayerFacilityDefend':
                // eventStore.storePlayerFacilityDefend(payload);
                break;
            case 'PlayerLogin':
                this.playerLoginEventHandler.handle(event);
                break;
            case 'PlayerLogout':
                this.playerLogoutEventHandler.handle(event);
                break;
            case 'SkillAdded':
                // eventStore.storeSkillAdded(payload);
                break;
            case 'VehicleDestroy':
                // eventStore.storeVehicleDestroy(payload);
                break;
            case 'ContinentLock':
                this.continentLockHandler.handle(event);
                break;
            // Documented but never happens
            // case 'ContinentUnlock':
            //     eventStore.storeContinentUnlock(payload);
            //     break;
            default:
                return false;
        }

        return true;
    }
}
