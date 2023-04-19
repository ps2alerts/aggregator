import {ActionInterface} from '../interfaces/ActionInterface';
import FacilityControlEvent from '../handlers/ps2census/events/FacilityControlEvent';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {OutfitwarsTerritoryResultInterface} from '../ps2alerts-constants/interfaces/OutfitwarsTerritoryResultInterface';
import {Logger} from '@nestjs/common';
import MetricsHandler, {MetricTypes} from '../handlers/MetricsHandler';
import {PS2AlertsApiDriver} from '../drivers/PS2AlertsApiDriver';

export default class OutfitwarsTerritoryFacilityControlAction implements ActionInterface<boolean> {
    private static readonly logger = new Logger('OutfitwarsTerritoryFacilityControlAction');

    constructor(
        private readonly event: FacilityControlEvent,
        private readonly territoryResultAction: ActionInterface<OutfitwarsTerritoryResultInterface>,
        private readonly territoryTeamAction: ActionInterface<boolean>,
        private readonly ps2AlertsApiClient: PS2AlertsApiDriver,
        private readonly metricsHandler: MetricsHandler,
    ) {}

    public async execute(): Promise<boolean> {
        // If a defence, we don't care, no need to recalculate everything.
        if (this.event.isDefence) {
            return true;
        }

        OutfitwarsTerritoryFacilityControlAction.logger.log(`[${this.event.instance.instanceId}] Running FacilityControlAction`);

        // Update the result for the instance
        await this.territoryResultAction.execute();

        OutfitwarsTerritoryFacilityControlAction.logger.log(`[${this.event.instance.instanceId}] Running TeamAction`);
        // Update the teams for the instance
        await this.territoryTeamAction.execute();

        const endpoint = ps2AlertsApiEndpoints.outfitwarsInstanceFacilityFacility
            .replace('{instanceId}', this.event.instance.instanceId)
            .replace('{facilityId}', String(this.event.facility.id));

        const started = new Date();

        // Update the mapControl record for the facility itself, since we now know the result values.
        // This is used to display the snapshot in times for each facility capture, so we can render the map correctly.
        // Note: This will update the LATEST record, it is assumed it is created first.
        await this.ps2AlertsApiClient.patch(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            endpoint,
            {mapControl: this.event.instance.result},
        ).catch((err: Error) => {
            OutfitwarsTerritoryFacilityControlAction.logger.error(`[${this.event.instance.instanceId}] Unable to update the facility control record via API! Err: ${err.message}`);
        });

        await this.metricsHandler.logMetric(started, MetricTypes.PS2ALERTS_API);

        return true;
    }
}
