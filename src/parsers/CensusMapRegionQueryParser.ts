// Special class to handle the MapRegion query, as it's done in multiple places and prone to crashing
import {rest} from 'ps2census';
import {CensusApiRetryDriver} from '../drivers/CensusApiRetryDriver';
import ApplicationException from '../exceptions/ApplicationException';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {Zone} from '../constants/zone';

/* eslint-disable */
interface ReversedEngineeredOshurDataInterface {
    map_region_id: string;
    facility_id: string;
    facility_name: string;
    facility_type_id: string;
}

interface RegionMapJoinQueryInterface {
    ZoneId: string;
    Regions: {
        IsList: string;
        Row: RegionMapJoinQueryRowInterface[];
        [prop: string]: any;
    }
    [prop: string]: any;
}

interface RegionMapJoinQueryRowInterface {
    RowData: {
        [prop: string]: any;
        RegionId: string;
        FactionId: string;
        map_region: {
            facility_id: string
            facility_type_id: string
            facility_name: string
        }
    };
}

/* eslint-enable */

export default class CensusMapRegionQueryParser {
    private readonly getMethod: rest.requestTypes.getMethod;
    private readonly caller: string;
    private readonly instance: MetagameTerritoryInstance;
    private readonly oshurData: ReversedEngineeredOshurDataInterface[];

    constructor(
        getMethod: rest.requestTypes.getMethod,
        caller: string,
        instance: MetagameTerritoryInstance,
    ) {
        this.getMethod = getMethod;
        this.caller = caller;
        this.instance = instance;
        this.oshurData = this.initOshurData();
    }

    // Returns
    public async getMapData(): Promise<RegionMapJoinQueryInterface[]> {
        const request = this.getMethod(
            rest.join(
                rest.map,
                [{
                    type: 'map_region',
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    inject_at: 'map_region',
                    on: 'Regions.Row.RowData.RegionId',
                    to: 'map_region_id',
                }],
            ),
            { // Query for filter
                // eslint-disable-next-line @typescript-eslint/naming-convention
                world_id: String(this.instance.world),
                // eslint-disable-next-line @typescript-eslint/naming-convention
                zone_ids: String(this.instance.zone),
            },
        );

        const apiRequest = new CensusApiRetryDriver(request, 'MetagameInstanceTerritoryStartAction');
        let mapDataFinal: RegionMapJoinQueryInterface[] = [];

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await apiRequest.try().then((mapData: RegionMapJoinQueryInterface[]) => {
            if (!mapData || mapData.length === 0) {
                throw new ApplicationException(`[${this.instance.instanceId}] No map data was returned from Census! Cannot start alert properly!`);
            }

            // If not Oshur do not commence the patch
            if (this.instance.zone !== Zone.OSHUR) {
                mapDataFinal = mapData;
                return mapDataFinal;
            }

            // Loop the data and patch it
            for (const row of mapData[0].Regions.Row) {
                const oshurData = this.getOshurData(row);

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
        // Return the patched data. We have to do it outside of the last .then as there's some weird execution path stuff going on...
        return mapDataFinal;
    }

    // noinspection JSMethodCanBeStatic
    private initOshurData(): ReversedEngineeredOshurDataInterface[] {
        // eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-unsafe-return
        return require(`${__dirname}/../constants/lattice/344-reverse-engineered.json`);
    }

    // Grabs the data from Oshur and filters exactly what is required
    private getOshurData(
        row: RegionMapJoinQueryRowInterface,
    ): ReversedEngineeredOshurDataInterface {
        const foundOshurMapRegion: ReversedEngineeredOshurDataInterface[] = this.oshurData.filter((oshurRow) => {
            return row.RowData.RegionId === oshurRow.map_region_id;
        });

        return foundOshurMapRegion[0] ?? [];
    }
}
