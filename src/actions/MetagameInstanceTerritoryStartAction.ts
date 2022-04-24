import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import ApplicationException from '../exceptions/ApplicationException';
import CensusMapRegionQueryParser from '../parsers/CensusMapRegionQueryParser';
import MapDataInterface from '../interfaces/MapDataInterface';
import {censusOldFacilities} from '../constants/censusOldFacilities';
import {RestClient} from 'ps2census/dist/rest';
import {AxiosInstance} from 'axios';
import {ps2AlertsApiEndpoints} from '../constants/ps2AlertsApiEndpoints';
import {Redis} from 'ioredis';

export default class MetagameInstanceTerritoryStartAction implements ActionInterface<boolean> {
    private static readonly logger = getLogger('MetagameInstanceTerritoryStartAction');

    constructor(
        private readonly instance: MetagameTerritoryInstance,
        private readonly ps2alertsApiClient: AxiosInstance,
        private readonly restClient: RestClient,
        private readonly cacheClient: Redis,
    ) {}

    public async execute(): Promise<boolean> {
        MetagameInstanceTerritoryStartAction.logger.info(`[${this.instance.instanceId}] Running startActions()`);
        MetagameInstanceTerritoryStartAction.logger.info(`[${this.instance.instanceId}] Trying to get initial map state`);

        const docs = await this.getInitialMap();

        if (!docs) {
            throw new ApplicationException(`[${this.instance.instanceId}] Map state was empty!`, 'MetagameInstanceTerritoryStartAction');
        }

        await this.ps2alertsApiClient.post(
            ps2AlertsApiEndpoints.instanceEntriesFacilityBatch,
            docs,
        ).catch((err: Error) => {
            throw new ApplicationException(`[${this.instance.instanceId}] Unable to update bracket! E: ${err.message}`, 'MetagameInstanceTerritoryStartAction');
        });

        MetagameInstanceTerritoryStartAction.logger.info(`[${this.instance.instanceId}] Inserted initial map state`);
        return true;
    }

    private async getInitialMap(): Promise<MapDataInterface[]> {
        // Take a snapshot of the map for use with territory calculations for the end
        const mapData = await new CensusMapRegionQueryParser(
            this.restClient,
            'MetagameInstanceTerritoryStartAction',
            this.instance,
            this.cacheClient,
        ).getMapData();

        if (mapData.length === 0) {
            throw new ApplicationException('Unable to properly get map data from census!');
        }

        const docs: MapDataInterface[] = [];
        const date = new Date();

        mapData[0].Regions.Row.forEach((row) => {
            // Check if we have a facility type, if we don't chuck it as it's an old facility
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const facilityId = parseInt(row.RowData.map_region.facility_id, 10);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (row.RowData.map_region.facility_type_id && facilityId && !censusOldFacilities.includes(facilityId)) {
                docs.push({
                    instance: this.instance.instanceId,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    facility: facilityId,
                    timestamp: date,
                    oldFaction: parseInt(row.RowData.FactionId, 10),
                    newFaction: parseInt(row.RowData.FactionId, 10),
                    durationHeld: 0,
                    isDefence: 0,
                    isInitial: true,
                    outfitCaptured: null,
                });
            } else {
                MetagameInstanceTerritoryStartAction.logger.warn(`[${this.instance.instanceId}] Unknown / invalid facility detected! ${row.RowData.map_region.facility_name}`);
            }
        });

        return docs;
    }
}
