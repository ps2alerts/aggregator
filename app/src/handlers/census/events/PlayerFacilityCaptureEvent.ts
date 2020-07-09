import { injectable } from 'inversify';
import { GenericEvent } from '../../../types/censusEventTypes';
import { PlayerFacilityCapture } from 'ps2census/dist/client/utils/PS2Events';
import Parser from '../../../utils/parser';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import ZoneUtils from '../../../utils/ZoneUtils';
import { Zone } from '../../../constants/zone';

@injectable()
export default class PlayerFacilityCaptureEvent {
    public readonly worldId: number;
    public readonly zone: Zone;
    public readonly timestamp: number;
    public readonly characterId: number;
    public readonly facilityId: number;
    public readonly outfitId: number;

    public constructor(
        event: GenericEvent
    ) {
        const playerFacilityCapture = event as PlayerFacilityCapture;
        this.worldId = Parser.parseArgumentAsNumber(playerFacilityCapture.world_id);
        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id');
        }
        // No check needed, ZoneUtils will take care of this
        this.zone = ZoneUtils.parse(Parser.parseArgumentAsNumber(playerFacilityCapture.zone_id));
        this.timestamp = Parser.parseArgumentAsNumber(playerFacilityCapture.timestamp);
        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp');
        }
        this.characterId = Parser.parseArgumentAsNumber(playerFacilityCapture.character_id);
        if (isNaN(this.characterId)) {
            throw new IllegalArgumentException('character_id');
        }
        this.facilityId = Parser.parseArgumentAsNumber(playerFacilityCapture.facility_id);
        if (isNaN(this.facilityId)) {
            throw new IllegalArgumentException('facility_id');
        }
        this.outfitId = Parser.parseArgumentAsNumber(playerFacilityCapture.outfit_id);
        if (isNaN(this.outfitId)) {
            throw new IllegalArgumentException('outfit_id');
        }
    }
}
