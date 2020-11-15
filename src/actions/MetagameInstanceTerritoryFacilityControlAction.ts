import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {InstanceMetagameTerritorySchemaInterface} from '../models/instance/InstanceMetagameTerritory';
import ApplicationException from '../exceptions/ApplicationException';
import TerritoryCalculator from '../calculators/TerritoryCalculator';
import TerritoryCalculatorFactory from '../factories/TerritoryCalculatorFactory';
import {inject} from 'inversify';
import {TYPES} from '../constants/types';

export default class MetagameInstanceTerritoryFacilityControlAction implements ActionInterface {
    private static readonly logger = getLogger('MetagameInstanceTerritoryFacilityControlAction');
    private readonly instance: MetagameTerritoryInstance;
    private readonly instanceMetagameFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>;
    private readonly territoryCalculator: TerritoryCalculator;
    private readonly isDefence: boolean;

    constructor(
        instance: MetagameTerritoryInstance,
        instanceMetagameFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>,
        @inject(TYPES.territoryCalculatorFactory) territoryCalculatorFactory: TerritoryCalculatorFactory,
        isDefence: boolean,
    ) {
        this.instance = instance;
        this.instanceMetagameFactory = instanceMetagameFactory;
        this.territoryCalculator = territoryCalculatorFactory.build(instance);
        this.isDefence = isDefence;
    }

    public async execute(): Promise<boolean> {
        // If a defence, we don't care, no need to recalculate everything.
        if (this.isDefence) {
            return false;
        }

        MetagameInstanceTerritoryFacilityControlAction.logger.info(`Running FacilityControlAction for instance "${this.instance.world}-${this.instance.censusInstanceId}"`);

        try {
            // Update database record with the winner of the Metagame (currently territory)
            await this.instanceMetagameFactory.model.updateOne(
                {instanceId: this.instance.instanceId},
                {result: await this.territoryCalculator.calculate()},
            ).catch((err: Error) => {
                throw new ApplicationException(`Unable to update result data for instance ${this.instance.instanceId}! Err: ${err.message}`, 'MetagameInstanceTerritoryFacilityControlAction');
            });
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            MetagameInstanceTerritoryFacilityControlAction.logger.error(`Unable to process FacilityControlActions for instance ${this.instance.instanceId}! Err: ${err.message}`);
        }

        return true;
    }
}
