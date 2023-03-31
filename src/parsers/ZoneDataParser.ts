/* eslint-disable @typescript-eslint/naming-convention */
import {getZoneLatticeVersion, Zone} from '../ps2alerts-constants/zone';
import {Inject, Injectable, Logger} from '@nestjs/common';
import {censusOldFacilities} from '../ps2alerts-constants/censusOldFacilities';
import ApplicationException from '../exceptions/ApplicationException';
import {CensusFacilityRegion, CensusRegionResponseInterface} from '../interfaces/CensusRegionEndpointInterfaces';
import {TYPES} from '../constants/types';
import {AxiosInstance} from 'axios';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import Redis from 'ioredis';

@Injectable()
export default class ZoneDataParser {
    private static readonly logger = new Logger('ZoneDataParser');

    constructor(
        @Inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
        private readonly cacheClient: Redis,
    ) {}

    // Sends a call off to the PS2A API to grab the map data based on current date and zone, pulling in the correct lattice links contextually based off instance date.
    public async getRegions(zone: Zone, date: Date): Promise<CensusFacilityRegion[]> {
        ZoneDataParser.logger.debug('getRegions');

        const latticeVersion = getZoneLatticeVersion(zone, date);

        const cacheKey = `regionData-z:${zone}-v:${latticeVersion}`;

        ZoneDataParser.logger.debug(cacheKey);

        // Pull lattice data out of cache if it exists
        if (await this.cacheClient.exists(cacheKey)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return JSON.parse(await this.cacheClient.get(`regionData-z:${zone}-v:${latticeVersion}`));
        }

        const path = ps2AlertsApiEndpoints.censusRegions
            .replace('{zone}', zone.toString())
            .replace('{version}', latticeVersion);

        ZoneDataParser.logger.debug(path);
        const response = await this.ps2AlertsApiClient.get(path);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const regionData: CensusRegionResponseInterface = response.data;

        ZoneDataParser.logger.debug(response.data);

        // This absolutely must not fail, so cause a full application crash if the data is somehow missing.
        if (!regionData?.map_region_list?.length) {
            throw new ApplicationException(`Region data for zone ${zone} and lattice version ${latticeVersion} is missing!`, 'ZoneDataParser.getRegions', 1);
        }

        const data: CensusFacilityRegion[] = [];

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

        await this.cacheClient.setex(cacheKey, 3600, JSON.stringify(data));

        return data;
    }

    // Facility link data from Census is annoyingly not bidirectional, meaning a base may have 0 links but other bases may link to it. This function makes it bidirectional enabling us to traverse it correctly.
    public async getLattices(zone: Zone, date: Date): Promise<Map<string, Set<string>>> {
        const regions = await this.getRegions(zone, date);
        const facilities = new Map<string, Set<string>>();

        if (!regions) {
            throw new ApplicationException('No lattice data was returned!', 'ZoneDataParser.getLattices');
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
}
