/* eslint-disable @typescript-eslint/restrict-template-expressions */
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {ActionInterface} from '../interfaces/ActionInterface';
import ApplicationException from '../exceptions/ApplicationException';
import CensusMapRegionQueryParser from '../parsers/CensusMapRegionQueryParser';
import MapDataInterface from '../interfaces/MapDataInterface';
import {censusOldFacilities} from '../ps2alerts-constants/censusOldFacilities';
import {Rest} from 'ps2census';
import {AxiosInstance} from 'axios';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import Redis from 'ioredis';
import ZoneDataParser from '../parsers/ZoneDataParser';
import {Logger} from '@nestjs/common';
import MetricsHandler, {MetricTypes} from '../handlers/MetricsHandler';
import {ConfigService} from '@nestjs/config';

export default class MetagameInstanceTerritoryStartAction implements ActionInterface<boolean> {
    private static readonly logger = new Logger('MetagameInstanceTerritoryStartAction');

    constructor(
        private readonly instance: MetagameTerritoryInstance,
        private readonly ps2alertsApiClient: AxiosInstance,
        private readonly restClient: Rest.Client,
        private readonly cacheClient: Redis,
        private readonly zoneDataParser: ZoneDataParser,
        private readonly metricsHandler: MetricsHandler,
        private readonly config: ConfigService,
    ) {}

    public async execute(): Promise<boolean> {
        MetagameInstanceTerritoryStartAction.logger.debug(`[${this.instance.instanceId}] Running startActions()`);
        MetagameInstanceTerritoryStartAction.logger.debug(`[${this.instance.instanceId}] Trying to get initial map state`);

        const docs = await this.getInitialMap();

        if (!docs) {
            throw new ApplicationException(`[${this.instance.instanceId}] Map state was empty!`, 'MetagameInstanceTerritoryStartAction');
        }

        const started = new Date();

        await this.ps2alertsApiClient.post(
            ps2AlertsApiEndpoints.instanceEntriesFacilityBatch,
            docs,
        ).then(async () => {
            await this.metricsHandler.logMetric(started, MetricTypes.PS2ALERTS_API_INSTANCE_FACILITY, true);
        }).catch(async (err: Error) => {
            await this.metricsHandler.logMetric(started, MetricTypes.PS2ALERTS_API_INSTANCE_FACILITY, false);

            throw new ApplicationException(`[${this.instance.instanceId}] Unable to insert initial map state! E: ${err.message}`, 'MetagameInstanceTerritoryStartAction');
        });

        MetagameInstanceTerritoryStartAction.logger.log(`[${this.instance.instanceId}] Inserted initial map state`);

        return true;
    }

    private async getInitialMap(): Promise<MapDataInterface[]> {
        const date = new Date();

        // Take a snapshot of the map for use with territory calculations for the end
        const mapData = await new CensusMapRegionQueryParser(
            this.restClient,
            'MetagameInstanceTerritoryStartAction',
            this.instance,
            this.cacheClient,
            this.zoneDataParser,
            this.metricsHandler,
            this.config,
        ).getMapData();
        await this.metricsHandler.logMetric(date, MetricTypes.CENSUS_MAP_REGION);

        if (mapData.length === 0) {
            throw new ApplicationException('Unable to properly get map data from census!');
        }

        const docs: MapDataInterface[] = [];

        mapData[0].Regions.Row.forEach((row) => {
            // Check if we have a facility type, if we don't chuck it as it's an old facility
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const facilityId = parseInt(row.RowData.map_region.facility_id, 10);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (row.RowData.map_region.facility_type_id && facilityId && !censusOldFacilities.includes(facilityId)) {
                docs.push({
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    instance: this.instance.instanceId,
                    facility: facilityId,
                    timestamp: date,
                    oldFaction: parseInt(row.RowData.FactionId, 10),
                    newFaction: parseInt(row.RowData.FactionId, 10),
                    durationHeld: 0,
                    isDefence: false,
                    isInitial: true,
                    outfitCaptured: null,
                });
            } else {
                MetagameInstanceTerritoryStartAction.logger.warn(`[${this.instance.instanceId}] Unknown / invalid map region without a facility detected! ${row.RowData.map_region.facility_name}. On Oshur this is expected.`);
            }
        });

        return docs;
    }
}
