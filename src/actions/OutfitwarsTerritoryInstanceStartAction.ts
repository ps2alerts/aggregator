/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {ActionInterface} from '../interfaces/ActionInterface';
import ApplicationException from '../exceptions/ApplicationException';
import MapDataInterface from '../interfaces/MapDataInterface';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {censusOldFacilities} from '../ps2alerts-constants/censusOldFacilities';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import {NexusInitialMapData} from '../ps2alerts-constants/outfitwars/nexus';
import {Logger} from '@nestjs/common';
import MetricsHandler, {MetricTypes} from '../handlers/MetricsHandler';
import {PS2AlertsApiDriver} from '../drivers/PS2AlertsApiDriver';

// TODO: Abstract this class!
export default class OutfitwarsTerritoryInstanceStartAction implements ActionInterface<boolean> {
    private static readonly logger = new Logger('OutfitwarsTerritoryInstanceStartAction');

    constructor(
        private readonly instance: OutfitWarsTerritoryInstance,
        private readonly ps2alertsApiClient: PS2AlertsApiDriver,
        private readonly metricsHandler: MetricsHandler,
    ) {}

    public async execute(): Promise<boolean> {
        OutfitwarsTerritoryInstanceStartAction.logger.log(`[${this.instance.instanceId}] Running startActions()`);
        OutfitwarsTerritoryInstanceStartAction.logger.log(`[${this.instance.instanceId}] Trying to get initial map state`);

        const docs = this.getInitialMap();

        if (!docs) {
            throw new ApplicationException(`[${this.instance.instanceId}] Map state was empty!`, 'OutfitwarsTerritoryInstanceStartAction');
        }

        const started = new Date();

        await this.ps2alertsApiClient.post(
            ps2AlertsApiEndpoints.outfitwarsFacilityBatch,
            docs,
        ).catch((err: Error) => {
            throw new ApplicationException(`[${this.instance.instanceId}] Unable to update bracket! E: ${err.message}`, 'OutfitwarsTerritoryInstanceStartAction');
        });

        await this.metricsHandler.logMetric(started, MetricTypes.PS2ALERTS_API);

        OutfitwarsTerritoryInstanceStartAction.logger.log(`[${this.instance.instanceId}] Inserted initial map state`);

        return true;
    }

    private getInitialMap(): MapDataInterface[] {
        // Take a snapshot of the map for use with territory calculations for the end
        const mapData = NexusInitialMapData;

        const docs: MapDataInterface[] = [];
        const date = new Date();

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
                OutfitwarsTerritoryInstanceStartAction.logger.warn(`[${this.instance.instanceId}] Unknown / invalid facility detected! ${row.RowData.map_region.facility_name}`);
            }
        });

        return docs;
    }
}
