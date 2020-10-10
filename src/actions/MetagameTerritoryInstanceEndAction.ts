import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {InstanceMetagameTerritorySchemaInterface} from '../models/instance/InstanceMetagameTerritory';
import Census from '../config/census';
import {InstanceFacilityControlSchemaInterface} from '../models/instance/InstanceFacilityControlModel';
import ApplicationException from '../exceptions/ApplicationException';
import FactionUtils from '../utils/FactionUtils';
import TerritoryVictoryCondition, {MetagameTerritoryResult} from '../victories/TerritoryVictoryCondition';
import {jsonLogOutput} from '../utils/json';

export default class MetagameTerritoryInstanceEndAction implements ActionInterface {
    private static readonly logger = getLogger('MetagameTerritoryInstanceEndAction');
    private readonly instance: MetagameTerritoryInstance;
    private readonly instanceMetagameFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>;
    private readonly censusConfig: Census;
    private readonly instanceFacilityControlFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>;

    constructor(
        instance: MetagameTerritoryInstance,
        instanceFacilityControlFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,
        instanceMetagameFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>,
        censusConfig: Census,
    ) {
        this.instance = instance;
        this.instanceFacilityControlFactory = instanceFacilityControlFactory;
        this.instanceMetagameFactory = instanceMetagameFactory;
        this.censusConfig = censusConfig;
    }

    public async execute(): Promise<boolean> {
        MetagameTerritoryInstanceEndAction.logger.info(`Running endActions() for instance "${this.instance.world}-${this.instance.censusInstanceId}"`);

        try {
            // Update database record with the winner of the Metagame (currently territory)
            await this.instanceMetagameFactory.model.updateOne(
                {instanceId: this.instance.instanceId},
                {result: await this.calculateWinner()},
            ).catch((err: Error) => {
                throw new ApplicationException(`Unable to set winner for instance ${this.instance.instanceId}! Err: ${err.message}`);
            });
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            MetagameTerritoryInstanceEndAction.logger.error(`Unable to process endAction for instance ${this.instance.instanceId}! Err: ${err.message}`);
        }

        return true;
    }

    public async calculateWinner(): Promise<MetagameTerritoryResult> {
        const victoryData: MetagameTerritoryResult = await new TerritoryVictoryCondition(
            this.instance,
            this.instanceFacilityControlFactory,
            this.censusConfig,
        ).calculate();

        MetagameTerritoryInstanceEndAction.logger.info(jsonLogOutput(victoryData));

        if (victoryData.draw) {
            MetagameTerritoryInstanceEndAction.logger.info(`Instance ${this.instance.instanceId} resulted in a DRAW!`);
        } else {
            MetagameTerritoryInstanceEndAction.logger.info(`Instance ${this.instance.instanceId} winner is: ${FactionUtils.parseFactionIdToShortName(victoryData.winner).toUpperCase()}!`);
        }

        return victoryData;
    }
}
