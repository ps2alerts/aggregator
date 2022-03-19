import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {InstanceMetagameTerritorySchemaInterface} from '../models/instance/InstanceMetagameTerritory';
import ApplicationException from '../exceptions/ApplicationException';
import TerritoryCalculator from '../calculators/TerritoryCalculator';
import {CensusEnvironment} from '../types/CensusEnvironment';
import TerritoryResultInterface from '../interfaces/TerritoryResultInterface';

export default class MetagameInstanceTerritoryFacilityControlAction implements ActionInterface {
    private static readonly logger = getLogger('MetagameInstanceTerritoryFacilityControlAction');

    constructor(
        private readonly instance: MetagameTerritoryInstance,
        private readonly environment: CensusEnvironment,
        private readonly instanceMetagameFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>,
        private readonly territoryCalculator: TerritoryCalculator,
        private readonly isDefence: boolean,
    ) {}

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
            if (err instanceof Error) {
                throw new ApplicationException(`Unable to process FacilityControlActions for instance ${this.instance.instanceId}! Err: ${err.message}`);
            }
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
        } catch (err) {
            if (attempts === 3) {
                if (err instanceof Error) {
                    MetagameInstanceTerritoryFacilityControlAction.logger.error(`[${this.instance.instanceId}] Error running TerritoryCalculator - Attempt #${attempts}. E: ${err.message}`);
                }

            } else {
                if (err instanceof Error) {
                    MetagameInstanceTerritoryFacilityControlAction.logger.warn(`[${this.instance.instanceId}] Error running TerritoryCalculator - Attempt #${attempts}. E: ${err.message}`);
                }
            }

            setTimeout(() => {
                MetagameInstanceTerritoryFacilityControlAction.logger.warn(`[${this.instance.instanceId}] Retrying TerritoryCalculator - Attempt #${attempts}`);
                void this.tryCalculate(attempts);
            }, 5000);
        }
    }
}
