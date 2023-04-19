import {ActionInterface} from '../interfaces/ActionInterface';
import FacilityControlEvent from '../handlers/ps2census/events/FacilityControlEvent';
import TerritoryResultInterface from '../ps2alerts-constants/interfaces/TerritoryResultInterface';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {AxiosInstance} from 'axios';
import {Logger} from '@nestjs/common';
import MetricsHandler, {MetricTypes} from '../handlers/MetricsHandler';

export default class MetagameInstanceTerritoryFacilityControlAction implements ActionInterface<boolean> {
    private static readonly logger = new Logger('MetagameInstanceTerritoryFacilityControlAction');

    constructor(
        private readonly event: FacilityControlEvent,
        private readonly territoryResultAction: ActionInterface<TerritoryResultInterface>,
        private readonly ps2AlertsApiClient: AxiosInstance,
        private readonly metricsHandler: MetricsHandler,
    ) {}

    public async execute(): Promise<boolean> {
        // If a defence, we don't care, no need to recalculate everything.
        if (this.event.isDefence) {
            return true;
        }

        MetagameInstanceTerritoryFacilityControlAction.logger.log(`[${this.event.instance.instanceId}] Running FacilityControlAction`);

        // Update the result for the instance
        await this.territoryResultAction.execute();

        const started = new Date();

        // Update the mapControl record for the facility itself, since we now know the result values.
        // This is used to display the snapshot in times for each facility capture, so we can render the map correctly.
        // Note: This will update the LATEST record, it is assumed it is created first.
        await this.ps2AlertsApiClient.patch(
            ps2AlertsApiEndpoints.instanceEntriesInstanceFacilityFacility
                .replace('{instanceId}', this.event.instance.instanceId)
                .replace('{facilityId}', String(this.event.facility.id)),
            {mapControl: this.event.instance.result},
        ).then(async () => {
            await this.metricsHandler.logMetric(started, MetricTypes.PS2ALERTS_API_INSTANCE_FACILITY, true);
        }).catch(async (err: Error) => {
            await this.metricsHandler.logMetric(started, MetricTypes.PS2ALERTS_API_INSTANCE_FACILITY, false);
            MetagameInstanceTerritoryFacilityControlAction.logger.error(`[${this.event.instance.instanceId}] Unable to update the facility control record via API! Err: ${err.message}`);
        });

        return true;
    }
}
