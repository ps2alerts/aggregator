/* eslint-disable @typescript-eslint/naming-convention,@typescript-eslint/no-explicit-any,@typescript-eslint/member-ordering */
export interface CensusRegionResponseInterface {
    map_region_list: CensusFacilityRegion[];
}

export interface CensusFacilityRegion {
    map_region_id: string;
    facility_id: string;
    facility_name: string;
    facility_type_id: string;
    facility_links: CensusRegionFacilityLinksInterface[] | undefined;
}

export interface CensusRegionFacilityLinksInterface {
    facility_id_b: string;
}

export interface CensusRegionMapJoinQueryInterface {
    ZoneId: string;
    Regions: {
        IsList: string;
        Row: CensusRegionMapJoinQueryRowInterface[];
        [prop: string]: any;
    };
    [prop: string]: any;
}

export interface CensusRegionMapJoinQueryRowInterface {
    RowData: {
        [prop: string]: any;
        RegionId: string;
        FactionId: string;
        map_region: {
            facility_id: string;
            facility_type_id: string;
            facility_name: string;
        };
    };
}
