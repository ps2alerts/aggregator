import WorldValidator from '../../validators/WorldValidator';
import { GenericEvent } from 'ps2census/dist/client/utils/PS2Events';
import { injectable } from 'inversify';
import ApplicationException from '../../exceptions/ApplicationException';

@injectable()
export default class CensusProxy {
    private static readonly logger = getLogger('CensusProxy');

    public constructor(
        private worldCheck:WorldValidator
    ) {

    }

    public handle(payload:GenericEvent): boolean {
        // Validate if the message is relevent for what we want, e.g. worlds and zones with active alerts on.
        if (!this.worldCheck.validate(parseInt(payload.world_id))) {
            return false;
        }

        switch (payload.event_name) {
            case 'AchievementEarned':
                // eventStore.storeAchievementEarned(payload);
                break;
            case 'BattleRankUp':
                // eventStore.storeBattleRankUp(payload);
                break;
            case 'Death':

                // eventStore.storeDeath(payload);
                break;
            case 'FacilityControl':
                // eventStore.storeFacilityControl(payload);
                break;
            case 'GainExperience':
                // eventStore.storeGainExperience(payload);
                break;
            case 'ItemAdded':
                // eventStore.storeItemAdded(payload);
                break;
            case 'MetagameEvent':
                // eventStore.storeMetagameEvent(payload);
                break;
            case 'PlayerFacilityCapture':
                // eventStore.storePlayerFacilityCapture(payload);
                break;
            case 'PlayerFacilityDefend':
                // eventStore.storePlayerFacilityDefend(payload);
                break;
            case 'PlayerLogin':
                // eventStore.storeLogin(payload.character_id,payload.event_name,payload.timestamp,payload.world_id);
                break;
            case 'PlayerLogout':
                // eventStore.storeLogout(payload.character_id,payload.event_name,payload.timestamp,payload.world_id);
                break;
            case 'SkillAdded':
                // eventStore.storeSkillAdded(payload);
                break;
            case 'VehicleDestroy':
                // eventStore.storeVehicleDestroy(payload);
                break;
            case 'ContinentLock':
                // eventStore.storeContinentLock(payload);
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
