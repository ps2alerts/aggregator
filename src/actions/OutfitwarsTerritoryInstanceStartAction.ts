/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import {Rest} from 'ps2census';
import {AxiosInstance} from 'axios';
import Redis from 'ioredis';
import ZoneDataParser from '../parsers/ZoneDataParser';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';

// TODO: Abstract this class!
export default class OutfitwarsTerritoryInstanceStartAction implements ActionInterface<boolean> {
    private static readonly logger = getLogger('OutfitwarsTerritoryInstanceStartAction');

    constructor(
        private readonly instance: OutfitWarsTerritoryInstance,
        private readonly ps2alertsApiClient: AxiosInstance,
        private readonly restClient: Rest.Client,
        private readonly cacheClient: Redis,
        private readonly zoneDataParser: ZoneDataParser,
    ) {}

    public async execute(): Promise<boolean> {
        OutfitwarsTerritoryInstanceStartAction.logger.info(`[${this.instance.instanceId}] Running startActions()`);
        OutfitwarsTerritoryInstanceStartAction.logger.info(`[${this.instance.instanceId}] Trying to get initial map state`);

        // const docs = await this.getInitialMap();
        //
        // if (!docs) {
        //     throw new ApplicationException(`[${this.instance.instanceId}] Map state was empty!`, 'OutfitwarsTerritoryInstanceStartAction');
        // }
        //
        // await this.ps2alertsApiClient.post(
        //     ps2AlertsApiEndpoints.instanceEntriesFacilityBatch,
        //     docs,
        // ).catch((err: Error) => {
        //     throw new ApplicationException(`[${this.instance.instanceId}] Unable to update bracket! E: ${err.message}`, 'OutfitwarsTerritoryInstanceStartAction');
        // });
        //
        // OutfitwarsTerritoryInstanceStartAction.logger.info(`[${this.instance.instanceId}] Inserted initial map state`);

        return true;
    }

    // private async getInitialMap(): Promise<MapDataInterface[]> {
    // TODO: Implement for OW

    // Take a snapshot of the map for use with territory calculations for the end
    // const mapData = await new CensusMapRegionQueryParser(
    //     this.restClient,
    //     'OutfitwarsTerritoryInstanceStartAction',
    //     this.instance,
    //     this.cacheClient,
    //     this.zoneDataParser,
    // ).getMapData();
    //
    // if (mapData.length === 0) {
    //     throw new ApplicationException('Unable to properly get map data from census!');
    // }
    //
    // const docs: MapDataInterface[] = [];
    // const date = new Date();
    //
    // mapData[0].Regions.Row.forEach((row) => {
    //     // Check if we have a facility type, if we don't chuck it as it's an old facility
    //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //     const facilityId = parseInt(row.RowData.map_region.facility_id, 10);
    //
    //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //     if (row.RowData.map_region.facility_type_id && facilityId && !censusOldFacilities.includes(facilityId)) {
    //         docs.push({
    //             // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    //             instance: this.instance.instanceId,
    //             facility: facilityId,
    //             timestamp: date,
    //             oldFaction: parseInt(row.RowData.FactionId, 10),
    //             newFaction: parseInt(row.RowData.FactionId, 10),
    //             durationHeld: 0,
    //             isDefence: false,
    //             isInitial: true,
    //             outfitCaptured: null,
    //         });
    //     } else {
    //         OutfitwarsTerritoryInstanceStartAction.logger.warn(`[${this.instance.instanceId}] Unknown / invalid facility detected! ${row.RowData.map_region.facility_name}`);
    //     }
    // });
    //
    // return docs;
    // }
}
