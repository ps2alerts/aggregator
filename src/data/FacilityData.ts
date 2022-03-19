import {FacilityDataInterface} from '../interfaces/FacilityDataInterface';
import {Zone} from '../constants/zone';
import {Format} from 'ps2census/dist/rest/types/collection';

class FacilityData implements FacilityDataInterface {
    public readonly id: number;
    public readonly name: string;
    public readonly type: number;
    public readonly zone: Zone;
    public readonly region: number;

    constructor(censusMapRegion: Format<'map_region'>, zone: Zone) {
        this.id = parseInt(censusMapRegion.facility_id, 10);
        this.name = censusMapRegion.facility_name;
        this.type = parseInt(censusMapRegion.facility_type_id, 10);
        this.zone = zone;
        this.region = parseInt(censusMapRegion.map_region_id, 10);
    }
}

export default FacilityData;
