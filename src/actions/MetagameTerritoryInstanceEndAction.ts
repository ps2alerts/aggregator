import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {InstanceMetagameTerritorySchemaInterface} from '../models/instance/InstanceMetagameTerritory';
import ApplicationException from '../exceptions/ApplicationException';
import FactionUtils from '../utils/FactionUtils';
import TerritoryCalculator, {TerritoryResultInterface} from '../calculators/TerritoryCalculator';
import {jsonLogOutput} from '../utils/json';
import TerritoryCalculatorFactory from '../factories/TerritoryCalculatorFactory';
import {inject} from 'inversify';
import {TYPES} from '../constants/types';

export default class MetagameTerritoryInstanceEndAction implements ActionInterface {
    private static readonly logger = getLogger('MetagameTerritoryInstanceEndAction');
    private readonly instance: MetagameTerritoryInstance;
    private readonly instanceMetagameFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>;
    private readonly territoryCalculator: TerritoryCalculator;

    constructor(
        instance: MetagameTerritoryInstance,
        instanceMetagameFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>,
        @inject(TYPES.territoryCalculatorFactory) territoryCalculatorFactory: TerritoryCalculatorFactory,
    ) {
        this.instance = instance;
        this.instanceMetagameFactory = instanceMetagameFactory;
        this.territoryCalculator = territoryCalculatorFactory.build(instance);
    }

    public async execute(): Promise<boolean> {
        MetagameTerritoryInstanceEndAction.logger.info(`[${this.instance.instanceId}] Running endAction`);

        try {
            // Update database record with the winner of the Metagame (currently territory)
            await this.instanceMetagameFactory.model.updateOne(
                {instanceId: this.instance.instanceId},
                {result: await this.calculateWinner()},
            ).catch((err: Error) => {
                throw new ApplicationException(`[${this.instance.instanceId}] Unable to set winner! Err: ${err.message}`);
            });
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            MetagameTerritoryInstanceEndAction.logger.error(`[${this.instance.instanceId}] Unable to process endAction! Err: ${err.message}`);
        }

        return true;
    }

    public async calculateWinner(): Promise<TerritoryResultInterface> {
        const result = await this.territoryCalculator.calculate();

        MetagameTerritoryInstanceEndAction.logger.info(jsonLogOutput(result));

        if (result.draw) {
            MetagameTerritoryInstanceEndAction.logger.info(`[${this.instance.instanceId}] resulted in a DRAW!`);
        } else {
            MetagameTerritoryInstanceEndAction.logger.info(`[${this.instance.instanceId}] winner is: ${FactionUtils.parseFactionIdToShortName(result.winner).toUpperCase()}!`);
        }

        return result;
    }
}
