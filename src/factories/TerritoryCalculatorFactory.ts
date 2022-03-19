import MongooseModelFactory from './MongooseModelFactory';
import {InstanceFacilityControlSchemaInterface} from '../models/instance/InstanceFacilityControlModel';
import {inject, injectable} from 'inversify';
import {TYPES} from '../constants/types';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import TerritoryCalculator from '../calculators/TerritoryCalculator';
import {CensusEnvironment} from '../types/CensusEnvironment';
import CensusStream from '../services/census/CensusStream';

@injectable()
export default class TerritoryCalculatorFactory {
    private readonly instanceFacilityControlFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>;

    constructor(
        @inject(TYPES.instanceFacilityControlModelFactory) private readonly instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,

    ) {
        this.instanceFacilityControlFactory = instanceFacilityControlModelFactory;
    }

    public build(
        instance: MetagameTerritoryInstance,
        environment: CensusEnvironment,
        censusStreamServices: CensusStream[],
    ): TerritoryCalculator {
        return new TerritoryCalculator(
            instance,
            environment,
            this.instanceFacilityControlFactory,
            censusStreamServices,
        );
    }
}
