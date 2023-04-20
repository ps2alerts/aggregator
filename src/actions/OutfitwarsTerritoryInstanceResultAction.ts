import {ActionInterface} from '../interfaces/ActionInterface';
import ApplicationException from '../exceptions/ApplicationException';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {OutfitwarsTerritoryResultInterface} from '../ps2alerts-constants/interfaces/OutfitwarsTerritoryResultInterface';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import OutfitwarsTerritoryCalculator from '../calculators/OutfitwarsTerritoryCalculator';
import {Logger} from '@nestjs/common';
import {PS2AlertsApiDriver} from '../drivers/PS2AlertsApiDriver';

// This class takes care of calculating the result of an instance and updating it via both the API and in memory
// Also fantastic naming I know :D
export default class OutfitwarsTerritoryInstanceResultAction implements ActionInterface<OutfitwarsTerritoryResultInterface> {
    private static readonly logger = new Logger('OutfitwarsTerritoryInstanceResultAction');

    constructor(
        private readonly instance: OutfitWarsTerritoryInstance,
        private readonly territoryCalculator: OutfitwarsTerritoryCalculator,
        private readonly ps2alertsApiClient: PS2AlertsApiDriver,
    ) {}

    public async execute(): Promise<OutfitwarsTerritoryResultInterface> {
        const result = await this.tryCalculate();

        if (result) {
            // Also update the instance in memory
            this.instance.result = result;
        }

        // Call API to patch the instance record
        await this.ps2alertsApiClient.patch(
            // eslint pls... why do you work for the instance version if this but not this one??!
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            ps2AlertsApiEndpoints.outfitwarsInstance
                .replace('{instanceId}', this.instance.instanceId),
            {result},
        ).catch((err: Error) => {
            throw new ApplicationException(`[${this.instance.instanceId}] Unable to update outfit wars instance result data! Err: ${err.message} - Data: ${JSON.stringify({result})}`, 'OutfitwarsTerritoryInstanceResultAction');
        });

        return result;
    }

    private async tryCalculate(attempts = 0): Promise<OutfitwarsTerritoryResultInterface> {
        attempts++;

        if (attempts > 3) {
            throw new ApplicationException('TerritoryCalculator failed after 3 attempts', 'OutfitwarsTerritoryInstanceResultAction');
        }

        OutfitwarsTerritoryInstanceResultAction.logger.debug(`[${this.instance.instanceId}] TerritoryCalculator attempt #${attempts}`);

        try {
            return await this.territoryCalculator.calculate();
        } catch (err) {
            if (attempts === 3) {
                if (err instanceof Error) {
                    OutfitwarsTerritoryInstanceResultAction.logger.error(`[${this.instance.instanceId}] Error running TerritoryCalculator - Attempt #${attempts}. E: ${err.message}`);
                }

            } else {
                if (err instanceof Error) {
                    OutfitwarsTerritoryInstanceResultAction.logger.warn(`[${this.instance.instanceId}] Error running TerritoryCalculator - Attempt #${attempts}. E: ${err.message}`);
                }
            }

            setTimeout(() => {
                OutfitwarsTerritoryInstanceResultAction.logger.warn(`[${this.instance.instanceId}] Retrying TerritoryCalculator - Attempt #${attempts}`);
                void this.tryCalculate(attempts);
            }, 5000);
        }

        throw new ApplicationException('TerritoryCalculator really borked', 'OutfitwarsTerritoryInstanceResultAction');
    }
}
