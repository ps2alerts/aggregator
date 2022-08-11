import {ActionInterface} from '../interfaces/ActionInterface';
import ApplicationException from '../exceptions/ApplicationException';
import {getLogger} from '../logger';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {AxiosInstance} from 'axios';
import {OutfitwarsTerritoryResultInterface} from '../ps2alerts-constants/interfaces/OutfitwarsTerritoryResultInterface';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import OutfitwarsTerritoryCalculator from '../calculators/OutfitwarsTerritoryCalculator';

// This class takes care of calculating the result of an instance and updating it via both the API and in memory
export default class OutfitwarsTerritoryInstanceTerritoryResultAction implements ActionInterface<OutfitwarsTerritoryResultInterface> {
    private static readonly logger = getLogger('MetagameInstanceTerritoryResultAction');

    constructor(
        private readonly instance: OutfitWarsTerritoryInstance,
        private readonly territoryCalculator: OutfitwarsTerritoryCalculator,
        private readonly ps2alertsApiClient: AxiosInstance,
    ) {}

    public async execute(): Promise<OutfitwarsTerritoryResultInterface> {
        const result = await this.tryCalculate();

        if (result) {
            // Also update the instance in memory
            this.instance.result = result;
        }

        // Call API to patch the instance record
        // TODO: Change this to a outfitwars sepcific endpoint
        await this.ps2alertsApiClient.patch(
            ps2AlertsApiEndpoints.instancesInstance
                .replace('{instanceId}', this.instance.instanceId),
            {result},
        ).catch((err: Error) => {
            throw new ApplicationException(`[${this.instance.instanceId}] Unable to update instance result data! Err: ${err.message} - Data: ${JSON.stringify({result})}`, 'MetagameInstanceTerritoryResultAction');
        });

        return result;
    }

    private async tryCalculate(attempts = 0): Promise<OutfitwarsTerritoryResultInterface> {
        attempts++;

        if (attempts > 3) {
            throw new ApplicationException('TerritoryCalculator failed after 3 attempts', 'MetagameInstanceTerritoryResultAction');
        }

        OutfitwarsTerritoryInstanceTerritoryResultAction.logger.debug(`[${this.instance.instanceId}] TerritoryCalculator attempt #${attempts}`);

        try {
            return await this.territoryCalculator.calculate();
        } catch (err) {
            if (attempts === 3) {
                if (err instanceof Error) {
                    OutfitwarsTerritoryInstanceTerritoryResultAction.logger.error(`[${this.instance.instanceId}] Error running TerritoryCalculator - Attempt #${attempts}. E: ${err.message}`);
                }

            } else {
                if (err instanceof Error) {
                    OutfitwarsTerritoryInstanceTerritoryResultAction.logger.warn(`[${this.instance.instanceId}] Error running TerritoryCalculator - Attempt #${attempts}. E: ${err.message}`);
                }
            }

            setTimeout(() => {
                OutfitwarsTerritoryInstanceTerritoryResultAction.logger.warn(`[${this.instance.instanceId}] Retrying TerritoryCalculator - Attempt #${attempts}`);
                void this.tryCalculate(attempts);
            }, 5000);
        }

        throw new ApplicationException('TerritoryCalculator really borked', 'MetagameInstanceTerritoryResultAction');
    }
}
