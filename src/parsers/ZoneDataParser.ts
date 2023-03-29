/* eslint-disable @typescript-eslint/naming-convention */
import {Zone, zoneArray} from '../ps2alerts-constants/zone';
import {Injectable} from '@nestjs/common';
import {censusOldFacilities} from '../ps2alerts-constants/censusOldFacilities';
import ApplicationException from '../exceptions/ApplicationException';
import {CensusFacilityRegion, CensusRegionResponseInterface} from '../interfaces/CensusRegionEndpointInterfaces';
import * as IndarMap from '../ps2alerts-constants/maps/regions-2-1.0.json';
import * as HossinMap from '../ps2alerts-constants/maps/regions-4-1.0.json';
import * as AmerishMap from '../ps2alerts-constants/maps/regions-6-1.0.json';
import * as EsamirMap from '../ps2alerts-constants/maps/regions-8-1.0.json';
import * as NexusMap from '../ps2alerts-constants/maps/regions-10-1.0.json';
import * as OshurMap from '../ps2alerts-constants/maps/regions-344-1.1.json';

@Injectable()
export default class ZoneDataParser {
    private readonly regionMap = new Map<Zone, CensusFacilityRegion[]>();
    private readonly latticeMap = new Map<Zone, Map<string, Set<string>>>();

    constructor() {
        this.initRegionData();
        this.initLatticeData();
    }

    public getRegions(zone: Zone): CensusFacilityRegion[] {
        const regions = this.regionMap.get(zone);

        // This absolutely must not fail, so cause a full application crash if the data is somehow missing.
        if (!regions) {
            throw new ApplicationException(`Region data for zone ${zone} is missing!`, 'ZoneDataParser', 1);
        }

        return regions;
    }

    // Facility link data is not bi-directional, meaning a base may have 0 links but other bases may link to it.
    // This function makes the data bi-directional so we can better traverse it.
    public getLattices(zone: Zone): Map<string, Set<string>> {
        const regions = this.getRegions(zone);
        const facilities = new Map<string, Set<string>>();

        if (!regions) {
            throw new ApplicationException('No lattice data was returned!', 'TerritoryCalculator.transformLatticeData');
        }

        regions.forEach((region) => {
            // If we have no link data, pointless to scan.
            if (!region.facility_links) {
                return;
            }

            region.facility_links.forEach((link) => {
                if (!facilities.has(region.facility_id)) {
                    facilities.set(region.facility_id, new Set());
                }

                if (!facilities.has(link.facility_id_b)) {
                    facilities.set(link.facility_id_b, new Set());
                }

                const setA = facilities.get(region.facility_id);
                const setB = facilities.get(link.facility_id_b);

                // Make TS happy even though it shouldn't be possible
                if (!setA || !setB) {
                    throw new ApplicationException('Sets are empty when just set, should not be possible.');
                }

                // Set opposites
                setA.add(link.facility_id_b);
                setB.add(region.facility_id);
            });
        });

        return facilities;
    }

    private initRegionData(): void {
        // Go through each zone and push the data to a map
        zoneArray.forEach((zone) => {
            const data: CensusFacilityRegion[] = [];

            const regionData = this.getRegionData(zone);

            regionData.map_region_list.forEach((region) => {
                const facilityId = parseInt(region.facility_id, 10);

                // If facility is in blacklist, don't map it
                if (censusOldFacilities.includes(facilityId) || isNaN(facilityId)) {
                    return;
                }

                data.push({
                    map_region_id: region.map_region_id,
                    facility_id: region.facility_id,
                    facility_name: region.facility_name,
                    facility_type_id: region.facility_type_id,
                    facility_links: region.facility_links, // used by getLattices
                });
            });

            this.regionMap.set(zone, data);
        });
    }

    private getRegionData(zone: number): CensusRegionResponseInterface {
        switch (zone) {
            case 2:
                return IndarMap as CensusRegionResponseInterface;
            case 4:
                return HossinMap as CensusRegionResponseInterface;
            case 6:
                return AmerishMap as CensusRegionResponseInterface;
            case 8:
                return EsamirMap as CensusRegionResponseInterface;
            case 10:
                return NexusMap as CensusRegionResponseInterface;
            case 344:
                return OshurMap as CensusRegionResponseInterface;
        }
    }

    private initLatticeData(): void {
        zoneArray.forEach((zone) => {
            this.latticeMap.set(zone, this.getLattices(zone));
        });
    }
}
