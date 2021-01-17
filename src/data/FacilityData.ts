import {rest} from 'ps2census';
import {FacilityDataInterface} from '../interfaces/FacilityDataInterface';
import {Zone} from '../constants/zone';

class FacilityData implements FacilityDataInterface {
    public readonly id: number;
    public readonly name: string;
    public readonly type: number;
    public readonly zone: Zone;
    public readonly region: number;

    constructor(censusMapRegion: rest.collectionTypes.mapRegion, zone: Zone) {
        this.id = parseInt(censusMapRegion.facility_id, 10);
        this.name = censusMapRegion.facility_name;
        this.type = parseInt(censusMapRegion.facility_type_id, 10);
        this.zone = zone;
        this.region = parseInt(censusMapRegion.map_region_id, 10);
    }
}

export default FacilityData;
