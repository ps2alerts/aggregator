import PS2AlertsMetagameInstance from '../instances/PS2AlertsMetagameInstance';
import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {InstanceMetagameSchemaInterface} from '../models/instance/InstanceMetagame';
import Census from '../config/census';
import {InstanceFacilityControlSchemaInterface} from '../models/instance/InstanceFacilityControlModel';
import {Faction} from '../constants/faction';
import ApplicationException from '../exceptions/ApplicationException';
import FactionUtils from '../utils/FactionUtils';
import TerritoryVictoryCondition, {TerritoryVictoryConditionResultInterface} from '../victories/TerritoryVictoryCondition';
import {jsonLogOutput} from '../utils/json';

export default class PS2AlertsMetagameInstanceEndAction implements ActionInterface {
    private static readonly logger = getLogger('PS2AlertsMetagameInstanceEndAction');
    private readonly instance: PS2AlertsMetagameInstance;
    private readonly instanceMetagameFactory: MongooseModelFactory<InstanceMetagameSchemaInterface>;
    private readonly censusConfig: Census;
    private readonly instanceFacilityControlFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>;

    constructor(
        instance: PS2AlertsMetagameInstance,
        instanceFacilityControlFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,
        instanceMetagameFactory: MongooseModelFactory<InstanceMetagameSchemaInterface>,
        censusConfig: Census,
    ) {
        this.instance = instance;
        this.instanceFacilityControlFactory = instanceFacilityControlFactory;
        this.instanceMetagameFactory = instanceMetagameFactory;
        this.censusConfig = censusConfig;
    }

    public async execute(): Promise<boolean> {
        PS2AlertsMetagameInstanceEndAction.logger.info(`Running endActions() for instance "${this.instance.world}-${this.instance.censusInstanceId}"`);

        try {
            // Update database record with the winner of the Metagame (currently territory)
            await this.instanceMetagameFactory.model.updateOne(
                {instanceId: this.instance.instanceId},
                {winner: await this.calculateWinner()}, // 0 = Draw
            ).catch((err: Error) => {
                throw new ApplicationException(`Unable to set winner for instance ${this.instance.instanceId}! Err: ${err.message}`);
            });
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            PS2AlertsMetagameInstanceEndAction.logger.error(`Unable to process endAction for instance ${this.instance.instanceId}! Err: ${err.message}`);
        }

        return true;
    }

    public async calculateWinner(): Promise<Faction> {
        const victoryData: TerritoryVictoryConditionResultInterface = await new TerritoryVictoryCondition(
            this.instance,
            this.instanceFacilityControlFactory,
            this.censusConfig,
        ).calculate();

        PS2AlertsMetagameInstanceEndAction.logger.info(jsonLogOutput(victoryData));

        if (victoryData.draw) {
            PS2AlertsMetagameInstanceEndAction.logger.info(`Instance ${this.instance.instanceId} resulted in a DRAW!`);
        } else {
            PS2AlertsMetagameInstanceEndAction.logger.info(`Instance ${this.instance.instanceId} winner is: ${FactionUtils.parseFactionIdToShortName(victoryData.winner).toUpperCase()}!`);
        }

        return victoryData.winner;
    }
}
