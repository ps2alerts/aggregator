// Special class to handle the MapRegion query, as it's done in multiple places and prone to crashing
import {CensusApiRetryDriver} from '../drivers/CensusApiRetryDriver';
import ApplicationException from '../exceptions/ApplicationException';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {Zone} from '../ps2alerts-constants/zone';
import {Rest} from 'ps2census';
import {getLogger} from '../logger';
import {Redis} from 'ioredis';
import {
    CensusFacilityRegion,
    CensusRegionMapJoinQueryInterface,
    CensusRegionMapJoinQueryRowInterface,
} from '../interfaces/CensusRegionEndpointInterfaces';
import ZoneDataParser from './ZoneDataParser';

export default class CensusMapRegionQueryParser {
    private static readonly logger = getLogger('CensusMapRegionQueryParser');

    private readonly oshurData: CensusFacilityRegion[];

    constructor(
        private readonly restClient: Rest.Client,
        private readonly caller: string,
        private readonly instance: MetagameTerritoryInstance,
        private readonly cacheClient: Redis,
        private readonly zoneDataParser: ZoneDataParser,
    ) {
        this.oshurData = this.initOshurData();
    }

    // Returns
    public async getMapData(): Promise<CensusRegionMapJoinQueryInterface[]> {
        const cacheKey = `census-map-w:${this.instance.world}-z:${this.instance.zone}`;

        // If in cache, grab it
        if (await this.cacheClient.exists(cacheKey)) {
            CensusMapRegionQueryParser.logger.debug(`${cacheKey} HIT`);
            const data = await this.cacheClient.get(cacheKey);

            if (data) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return JSON.parse(data);
            }
        }

        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        CensusMapRegionQueryParser.logger.debug(`[${this.instance.instanceId}] Grabbing map_region data from Census... (lets hope it doesn't fail...)`);

        const query = this.restClient.getQueryBuilder('map')
            .join({
                type: 'map_region',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                inject_at: 'map_region',
                on: 'Regions.Row.RowData.RegionId',
                to: 'map_region_id',
            });
        /* eslint-disable */
        const filter = {
            world_id: String(this.instance.world),
            zone_ids: String(this.instance.zone),
        };
        /* eslint-enable */

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const apiRequest = new CensusApiRetryDriver(query, filter, 'MetagameInstanceTerritoryStartAction');
        let mapDataFinal: CensusRegionMapJoinQueryInterface[] = [];

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await apiRequest.try().then((mapData: CensusRegionMapJoinQueryInterface[]) => {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            CensusMapRegionQueryParser.logger.debug(`[${this.instance.instanceId}] Census returned map_region data`);

            if (!mapData || mapData.length === 0) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`[${this.instance.instanceId}] No map data was returned from Census! Cannot start alert properly!`);
            }

            // If not Oshur do not commence the patch
            if (this.instance.zone !== Zone.OSHUR) {
                mapDataFinal = mapData;
                return mapDataFinal;
            }

            // Loop the data and patch it
            for (const row of mapData[0].Regions.Row) {
                const oshurData = this.getOshurRegionData(row);

                /* eslint-disable */
                row.RowData.map_region = {
                    facility_id: oshurData.facility_id,
                    facility_name: oshurData.facility_name,
                    facility_type_id: oshurData.facility_type_id,
                };
                /* eslint-enable */
            }

            mapDataFinal = mapData;
        }).catch((e) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to query Census for Map Region data! E: ${e.message}`);
        });

        // Cache the data
        await this.cacheClient.setex(cacheKey, 5, JSON.stringify(mapDataFinal));

        // Return the patched data. We have to do it outside of the last .then as there's some weird execution path stuff going on...
        return mapDataFinal;
    }

    // noinspection JSMethodCanBeStatic
    private initOshurData(): CensusFacilityRegion[] {
        return this.zoneDataParser.getRegions(Zone.OSHUR);
    }

    // Grabs the data from Oshur and filters exactly what is required
    private getOshurRegionData(
        row: CensusRegionMapJoinQueryRowInterface,
    ): CensusFacilityRegion {
        const foundRegion: CensusFacilityRegion[] = this.oshurData.filter((oshurRow) => {
            return row.RowData.RegionId === oshurRow.map_region_id;
        });

        return foundRegion[0] ?? [];
    }
}
