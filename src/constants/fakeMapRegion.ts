import FacilityData from '../data/FacilityData';
import {FacilityDataInterface} from '../interfaces/FacilityDataInterface';

/* eslint-disable */
export const fakeFacilityData = {
    map_region_id: "-1",
    zone_id: "2",
    facility_id: "-1",
    facility_name: "UNKNOWN FACILITY",
    facility_type_id: "1", // "Default"
    facility_type: "Default",
    location_x: '0',
    location_y: '0',
    location_z: '0',
    reward_amount: '0', // Wut
    reward_currency_id: '0', // Wut
}

/* eslint-enable */

export default class FakeMapRegionFactory {
    public build(id: number): FacilityDataInterface {
        const data = {
            ...fakeFacilityData,
            /* eslint-disable */
            facility_id: String(id),
            facility_name: `UNKNOWN FACILITY (${id})`,
            /* eslint-enable */
        };
        return new FacilityData(data, 2);
    }
}
