import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import FacilityControlEvent from '../handlers/ps2census/events/FacilityControlEvent';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {AxiosInstance} from 'axios';
import {OutfitwarsTerritoryResultInterface} from '../ps2alerts-constants/interfaces/OutfitwarsTerritoryResultInterface';

export default class OutfitwarsTerritoryFacilityControlAction implements ActionInterface<boolean> {
    private static readonly logger = getLogger('OutfitwarsTerritoryFacilityControlAction');

    constructor(
        private readonly event: FacilityControlEvent,
        private readonly territoryResultAction: ActionInterface<OutfitwarsTerritoryResultInterface>,
        private readonly ps2AlertsApiClient: AxiosInstance,
    ) {}

    public async execute(): Promise<boolean> {
        // If a defence, we don't care, no need to recalculate everything.
        if (this.event.isDefence) {
            return true;
        }

        OutfitwarsTerritoryFacilityControlAction.logger.info(`[${this.event.instance.instanceId}] Running FacilityControlAction`);

        // Update the result for the instance
        await this.territoryResultAction.execute();

        /* eslint-disable */
        const endpoint = ps2AlertsApiEndpoints.outfitwarsInstanceFacilityFacility
            .replace('{instanceId}', this.event.instance.instanceId)
            .replace('{facilityId}', String(this.event.facility.id));
        /* eslint-enable */

        // Update the mapControl record for the facility itself, since we now know the result values.
        // This is used to display the snapshot in times for each facility capture, so we can render the map correctly.
        // Note: This will update the LATEST record, it is assumed it is created first.
        await this.ps2AlertsApiClient.patch(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            endpoint,
            {mapControl: this.event.instance.result},
        ).catch((err: Error) => {
            OutfitwarsTerritoryFacilityControlAction.logger.error(`[${this.event.instance.instanceId}] Unable to update the facility control record via API! Err: ${err.message}`);
            console.log('endpoint', endpoint);
            console.log('data', JSON.stringify(this.event.instance.result));
        });

        return true;
    }
}
