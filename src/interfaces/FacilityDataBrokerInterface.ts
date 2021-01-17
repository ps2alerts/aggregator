import {CensusEnvironment} from '../types/CensusEnvironment';
import {Zone} from "../constants/zone";
import {FacilityDataInterface} from "./FacilityDataInterface";

export interface FacilityDataBrokerInterface<> {
    get(
        environment: CensusEnvironment,
        facilityId: number,
        zone: Zone
    ): Promise<FacilityDataInterface>;
}
