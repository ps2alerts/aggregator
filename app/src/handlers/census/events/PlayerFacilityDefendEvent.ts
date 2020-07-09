import { injectable } from 'inversify';
import { GenericEvent } from '../../../types/censusEventTypes';
import { PlayerFacilityDefend } from 'ps2census/dist/client/utils/PS2Events';
import Parser from '../../../utils/parser';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import ZoneUtils from '../../../utils/ZoneUtils';
import { Zone } from '../../../constants/zone';

@injectable()
export default class PlayerFacilityDefendEvent {
    public readonly worldId: number;
    public readonly zone: Zone;
    public readonly timestamp: number;
    public readonly characterId: number;
    public readonly facilityId: number;
    public readonly outfitId: number;

    public constructor(
        event: GenericEvent
    ) {
        const playerFacilityDefend = event as PlayerFacilityDefend;
        this.worldId = Parser.parseArgumentAsNumber(playerFacilityDefend.world_id);
        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id');
        }
        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseArgumentAsNumber(playerFacilityDefend.zone_id));
        this.timestamp = Parser.parseArgumentAsNumber(playerFacilityDefend.timestamp);
        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp');
        }
        this.characterId = Parser.parseArgumentAsNumber(playerFacilityDefend.character_id);
        if (isNaN(this.characterId)) {
            throw new IllegalArgumentException('character_id');
        }
        this.facilityId = Parser.parseArgumentAsNumber(playerFacilityDefend.facility_id);
        if (isNaN(this.facilityId)) {
            throw new IllegalArgumentException('facility_id');
        }
        this.outfitId = Parser.parseArgumentAsNumber(playerFacilityDefend.outfit_id);
        if (isNaN(this.outfitId)) {
            throw new IllegalArgumentException('outfit_id');
        }
    }
}
