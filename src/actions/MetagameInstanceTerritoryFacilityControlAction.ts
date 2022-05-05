import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import FacilityControlEvent from '../handlers/census/events/FacilityControlEvent';
import TerritoryResultInterface from '../interfaces/TerritoryResultInterface';

export default class MetagameInstanceTerritoryFacilityControlAction implements ActionInterface<boolean> {
    private static readonly logger = getLogger('MetagameInstanceTerritoryFacilityControlAction');

    constructor(
        private readonly event: FacilityControlEvent,
        private readonly territoryResultAction: ActionInterface<TerritoryResultInterface>,
    ) {}

    public async execute(): Promise<boolean> {
        // If a defence, we don't care, no need to recalculate everything.
        if (this.event.isDefence) {
            return true;
        }

        MetagameInstanceTerritoryFacilityControlAction.logger.info(`[${this.event.instance.instanceId}] Running FacilityControlAction`);

        // Update the result for the instance
        await this.territoryResultAction.execute();

        return true;
    }

}
