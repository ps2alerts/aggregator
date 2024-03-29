import {ActionInterface} from '../interfaces/ActionInterface';
import FacilityControlEvent from '../handlers/ps2census/events/FacilityControlEvent';
import TerritoryResultInterface from '../ps2alerts-constants/interfaces/TerritoryResultInterface';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {Logger} from '@nestjs/common';
import {PS2AlertsApiDriver} from '../drivers/PS2AlertsApiDriver';

export default class MetagameInstanceTerritoryFacilityControlAction implements ActionInterface<boolean> {
    private static readonly logger = new Logger('MetagameInstanceTerritoryFacilityControlAction');

    constructor(
        private readonly event: FacilityControlEvent,
        private readonly territoryResultAction: ActionInterface<TerritoryResultInterface>,
        private readonly ps2AlertsApiClient: PS2AlertsApiDriver,
    ) {}

    public async execute(): Promise<boolean> {
        // If a defence, we don't care, no need to recalculate everything.
        if (this.event.isDefence) {
            return true;
        }

        MetagameInstanceTerritoryFacilityControlAction.logger.log(`[${this.event.instance.instanceId}] Running FacilityControlAction`);

        // Update the result for the instance
        await this.territoryResultAction.execute();

        // Update the mapControl record for the facility itself, since we now know the result values.
        // This is used to display the snapshot in times for each facility capture, so we can render the map correctly.
        // Note: This will update the LATEST record, it is assumed it is created first.
        await this.ps2AlertsApiClient.patch(
            ps2AlertsApiEndpoints.instanceEntriesInstanceFacilityFacility
                .replace('{instanceId}', this.event.instance.instanceId)
                .replace('{facilityId}', String(this.event.facility.id)),
            {mapControl: this.event.instance.result},
        ).catch((err: Error) => {
            MetagameInstanceTerritoryFacilityControlAction.logger.error(`[${this.event.instance.instanceId}] Unable to update the facility control record via API! Err: ${err.message}`);
        });

        return true;
    }
}
