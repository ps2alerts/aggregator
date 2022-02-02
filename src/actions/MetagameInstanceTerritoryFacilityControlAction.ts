import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {InstanceMetagameTerritorySchemaInterface} from '../models/instance/InstanceMetagameTerritory';
import ApplicationException from '../exceptions/ApplicationException';
import TerritoryCalculator from '../calculators/TerritoryCalculator';
import TerritoryCalculatorFactory from '../factories/TerritoryCalculatorFactory';
import {CensusEnvironment} from '../types/CensusEnvironment';
import TerritoryResultInterface from '../interfaces/TerritoryResultInterface';

export default class MetagameInstanceTerritoryFacilityControlAction implements ActionInterface {
    private static readonly logger = getLogger('MetagameInstanceTerritoryFacilityControlAction');
    private readonly instance: MetagameTerritoryInstance;
    private readonly instanceMetagameFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>;
    private readonly territoryCalculator: TerritoryCalculator;
    private readonly isDefence: boolean;

    constructor(
        instance: MetagameTerritoryInstance,
        environment: CensusEnvironment,
        instanceMetagameFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>,
        territoryCalculatorFactory: TerritoryCalculatorFactory,
        isDefence: boolean,
    ) {
        this.instance = instance;
        this.instanceMetagameFactory = instanceMetagameFactory;
        this.territoryCalculator = territoryCalculatorFactory.build(instance, environment);
        this.isDefence = isDefence;
    }

    public async execute(): Promise<boolean> {
        // If a defence, we don't care, no need to recalculate everything.
        if (this.isDefence) {
            return false;
        }

        MetagameInstanceTerritoryFacilityControlAction.logger.info(`[${this.instance.instanceId}] Running FacilityControlAction`);

        try {
            const result = await this.tryCalculate(0);

            if (!result) {
                MetagameInstanceTerritoryFacilityControlAction.logger.error(`[${this.instance.instanceId}] tryCalculate returned no results!`, 'MetagameInstanceTerritoryFacilityControlAction');
                return false;
            }

            // Update database record with the result of the territory / victor
            await this.instanceMetagameFactory.model.updateOne(
                {instanceId: this.instance.instanceId},
                {result},
            ).catch((err: Error) => {
                throw new ApplicationException(`[${this.instance.instanceId}] Unable to update result data! Err: ${err.message}`, 'MetagameInstanceTerritoryFacilityControlAction');
            });

            // Also update the instance in memory
            this.instance.result = result;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to process FacilityControlActions for instance ${this.instance.instanceId}! Err: ${err.message}`);
        }

        return true;
    }

    private async tryCalculate(attempts = 0): Promise<TerritoryResultInterface | undefined> {
        attempts++;

        if (attempts > 3) {
            throw new ApplicationException('TerritoryCalculator failed after 3 attempts', 'MetagameInstanceTerritoryFacilityControlAction');
        }

        MetagameInstanceTerritoryFacilityControlAction.logger.debug(`TerritoryCalculator attempt #${attempts}`);

        try {
            return await this.territoryCalculator.calculate();
        } catch (e) {
            if (attempts === 3) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                MetagameInstanceTerritoryFacilityControlAction.logger.error(`[${this.instance.instanceId}] Error running TerritoryCalculator - Attempt #${attempts}. E: ${e.message}`);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                MetagameInstanceTerritoryFacilityControlAction.logger.warn(`[${this.instance.instanceId}] Error running TerritoryCalculator - Attempt #${attempts}. E: ${e.message}`);
            }

            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            setTimeout(async () => {
                MetagameInstanceTerritoryFacilityControlAction.logger.warn(`[${this.instance.instanceId}] Retrying TerritoryCalculator - Attempt #${attempts}`);
                return this.tryCalculate(attempts);
            }, 5000);
        }
    }
}
