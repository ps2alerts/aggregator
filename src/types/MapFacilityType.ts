import {rest} from 'ps2census';

export type MapFacilityType = rest.mapTypeData & {
    /* eslint-disable */
    Regions: {
        Row: Array<{
            RowData: {
                RegionId: string;
                FactionId: string;
                map_region: rest.mapRegionTypeData;
            };
        }>;
    };
    /* eslint-enable */
};
