import {ActionInterface} from '../interfaces/ActionInterface';
import TerritoryResultInterface from '../interfaces/TerritoryResultInterface';
import ApplicationException from '../exceptions/ApplicationException';
import {getLogger} from '../logger';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import TerritoryCalculator from '../calculators/TerritoryCalculator';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {AxiosInstance} from 'axios';

// This class takes care of calculating the result of an instance and updating it via both the API and in memory
export default class MetagameInstanceTerritoryResultAction implements ActionInterface<TerritoryResultInterface> {
    private static readonly logger = getLogger('MetagameInstanceTerritoryResultAction');

    constructor(
        private readonly instance: MetagameTerritoryInstance,
        private readonly territoryCalculator: TerritoryCalculator,
        private readonly ps2alertsApiClient: AxiosInstance,
    ) {}

    public async execute(): Promise<TerritoryResultInterface> {
        const result = await this.tryCalculate();

        if (result) {
            // Also update the instance in memory
            this.instance.result = result;
        }

        // Call API to patch the instance record
        await this.ps2alertsApiClient.patch(
            ps2AlertsApiEndpoints.instancesInstance
                .replace('{instanceId}', this.instance.instanceId),
            {result},
        ).catch((err: Error) => {
            throw new ApplicationException(`[${this.instance.instanceId}] Unable to update instance result data! Err: ${err.message} - Data: ${JSON.stringify({result})}`, 'MetagameInstanceTerritoryResultAction');
        });

        return result;
    }

    private async tryCalculate(attempts = 0): Promise<TerritoryResultInterface> {
        attempts++;

        if (attempts > 3) {
            throw new ApplicationException('TerritoryCalculator failed after 3 attempts', 'MetagameInstanceTerritoryResultAction');
        }

        MetagameInstanceTerritoryResultAction.logger.debug(`[${this.instance.instanceId}] TerritoryCalculator attempt #${attempts}`);

        try {
            return await this.territoryCalculator.calculate();
        } catch (err) {
            if (attempts === 3) {
                if (err instanceof Error) {
                    MetagameInstanceTerritoryResultAction.logger.error(`[${this.instance.instanceId}] Error running TerritoryCalculator - Attempt #${attempts}. E: ${err.message}`);
                }

            } else {
                if (err instanceof Error) {
                    MetagameInstanceTerritoryResultAction.logger.warn(`[${this.instance.instanceId}] Error running TerritoryCalculator - Attempt #${attempts}. E: ${err.message}`);
                }
            }

            setTimeout(() => {
                MetagameInstanceTerritoryResultAction.logger.warn(`[${this.instance.instanceId}] Retrying TerritoryCalculator - Attempt #${attempts}`);
                void this.tryCalculate(attempts);
            }, 5000);
        }

        throw new ApplicationException('TerritoryCalculator really borked', 'MetagameInstanceTerritoryResultAction');
    }
}
