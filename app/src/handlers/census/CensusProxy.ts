import WorldValidator from '../../validators/WorldValidator';
import { GenericEvent } from 'ps2census/dist/client/utils/PS2Events';
import { injectable } from 'inversify';
import DeathEventHandler from './DeathEventHandler';
import { getLogger } from '../../logger';
import config from '../../config';
import MetagameEventEventHandler from './MetagameEventEventHandler';
import PlayerLoginEventHandler from './PlayerLoginEventHandler';
import PlayerLogoutEventHandler from './PlayerLogoutEventHandler';
import ContinentLockHandler from './ContinentLockHandler';
import FacilityControlEventHandler from './FacilityControlEventHandler';
import GainExperienceHandler from './GainExperienceHandler';
import PlayerFacilityCaptureHandler from './PlayerFacilityCaptureHandler';
import PlayerFacilityDefendHandler from './PlayerFacilityDefendHandler';
import ContinentUnlockHandler from './ContinentUnlockHandler';
import AchievementEarnedHandler from './AchievementEarnedHandler';
import BattleRankUpHandler from './BattleRankUpHandler';

@injectable()
export default class CensusProxy {
    private static readonly logger = getLogger('CensusProxy');

    public constructor(
        private worldCheck: WorldValidator,
        private deathEventHandler: DeathEventHandler,
        private metagameEventEventHandler: MetagameEventEventHandler,
        private playerLoginEventHandler: PlayerLoginEventHandler,
        private playerLogoutEventHandler: PlayerLogoutEventHandler,
        private continentLockHandler: ContinentLockHandler,
        private continentUnlockHandler: ContinentUnlockHandler,
        private facilityControlEventHandler: FacilityControlEventHandler,
        private gainExperienceHandler: GainExperienceHandler,
        private playerFacilityCaptureHandler: PlayerFacilityCaptureHandler,
        private playerFacilityDefendHandler: PlayerFacilityDefendHandler,
        private achievementEarnedHandler: AchievementEarnedHandler,
        private battleRankUpHandler: BattleRankUpHandler
    ) {

    }

    public handle(event: GenericEvent): boolean {
        if (config.features.logging.censusIncomingEvents) {
            CensusProxy.logger.debug(`INCOMING EVENT ${event.event_name}`);
        }
        // Validate if the message is relevant for what we want, e.g. worlds and zones with active alerts on.
        if (!this.worldCheck.validate(parseInt(event.world_id))) {
            return false;
        }

        switch (event.event_name) {
            case 'AchievementEarned':
                this.achievementEarnedHandler.handle(event);
                break;
            case 'BattleRankUp':
                this.battleRankUpHandler.handle(event);
                break;
            case 'Death':
                this.deathEventHandler.handle(event);
                break;
            case 'FacilityControl':
                this.facilityControlEventHandler.handle(event);
                break;
            case 'GainExperience':
                this.gainExperienceHandler.handle(event);
                break;
            case 'ItemAdded':
                // eventStore.storeItemAdded(payload);
                break;
            case 'MetagameEvent':
                this.metagameEventEventHandler.handle(event);
                break;
            case 'PlayerFacilityCapture':
                this.playerFacilityCaptureHandler.handle(event);
                break;
            case 'PlayerFacilityDefend':
                this.playerFacilityDefendHandler.handle(event);
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
            // Will be fixed with #36
            //case 'ContinentUnlock':
            //this.continentUnlockHandler.handle(event);
            //break;
            default:
                return false;
        }
        return true;
    }
}
