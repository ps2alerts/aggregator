import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {ActionInterface} from '../interfaces/ActionInterface';
import ApplicationException from '../exceptions/ApplicationException';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {inject, injectable} from 'inversify';
import {TYPES} from '../constants/types';
import MongooseModelFactory from './MongooseModelFactory';
import {InstanceMetagameTerritorySchemaInterface} from '../models/instance/InstanceMetagameTerritory';
import Census from '../config/census';
import {InstanceFacilityControlSchemaInterface} from '../models/instance/InstanceFacilityControlModel';
import MetagameInstanceTerritoryStartAction from '../actions/MetagameInstanceTerritoryStartAction';
import MetagameTerritoryInstanceEndAction from '../actions/MetagameTerritoryInstanceEndAction';
import TerritoryCalculatorFactory from './TerritoryCalculatorFactory';
import MetagameInstanceTerritoryFacilityControlAction from '../actions/MetagameInstanceTerritoryFacilityControlAction';
import BracketCalculatorFactory from './BracketCalculatorFactory';

@injectable()
export default class InstanceActionFactory {
    private readonly instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>;
    private readonly instanceMetagameModelFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>;
    private readonly censusConfig: Census;
    private readonly territoryCalculatorFactory: TerritoryCalculatorFactory;
    private readonly bracketCalculatorFactory: BracketCalculatorFactory;

    constructor(
    @inject(TYPES.instanceFacilityControlModelFactory) instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,
        @inject(TYPES.instanceMetagameModelFactory) instanceMetagameModelFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>,
        @inject(TYPES.censusConfig) censusConfig: Census,
        @inject(TYPES.territoryCalculatorFactory) territoryCalculatorFactory: TerritoryCalculatorFactory,
        @inject(TYPES.bracketCalculatorFactory) bracketCalculatorFactory: BracketCalculatorFactory,
    ) {
        this.instanceFacilityControlModelFactory = instanceFacilityControlModelFactory;
        this.instanceMetagameModelFactory = instanceMetagameModelFactory;
        this.censusConfig = censusConfig;
        this.territoryCalculatorFactory = territoryCalculatorFactory;
        this.bracketCalculatorFactory = bracketCalculatorFactory;
    }

    public buildStart(instance: PS2AlertsInstanceInterface): ActionInterface {
        if (instance instanceof MetagameTerritoryInstance) {
            return new MetagameInstanceTerritoryStartAction(
                instance,
                this.instanceMetagameModelFactory,
                this.instanceFacilityControlModelFactory,
                this.censusConfig,
                this.buildFacilityControlEvent(instance, false),
                this.bracketCalculatorFactory.build(instance),
            );
        }

        throw new ApplicationException('Unable to determine start action!', 'InstanceActionFactory');
    }

    public buildEnd(instance: PS2AlertsInstanceInterface): ActionInterface {
        if (instance instanceof MetagameTerritoryInstance) {
            return new MetagameTerritoryInstanceEndAction(
                instance,
                this.instanceMetagameModelFactory,
                this.territoryCalculatorFactory,
            );
        }

        throw new ApplicationException('Unable to determine endAction!', 'InstanceActionFactory');
    }

    public buildFacilityControlEvent(instance: PS2AlertsInstanceInterface, isDefence: boolean): ActionInterface {
        if (instance instanceof MetagameTerritoryInstance) {
            return new MetagameInstanceTerritoryFacilityControlAction(
                instance,
                this.instanceMetagameModelFactory,
                this.territoryCalculatorFactory,
                isDefence,
            );
        }

        throw new ApplicationException('Unable to determine facilityControlEventAction!', 'InstanceActionFactory');
    }
}
