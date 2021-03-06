import MongooseModelFactory from './MongooseModelFactory';
import {InstanceFacilityControlSchemaInterface} from '../models/instance/InstanceFacilityControlModel';
import Census from '../config/census';
import {inject, injectable} from 'inversify';
import {TYPES} from '../constants/types';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import TerritoryCalculator from '../calculators/TerritoryCalculator';
import {CensusEnvironment} from '../types/CensusEnvironment';

@injectable()
export default class TerritoryCalculatorFactory {
    private readonly instanceFacilityControlFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>;
    private readonly censusConfig: Census;

    constructor(
    @inject(TYPES.instanceFacilityControlModelFactory) instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,
        @inject(TYPES.censusConfig) censusConfig: Census,

    ) {
        this.instanceFacilityControlFactory = instanceFacilityControlModelFactory;
        this.censusConfig = censusConfig;
    }

    public build(
        instance: MetagameTerritoryInstance,
        environment: CensusEnvironment,
    ): TerritoryCalculator {
        return new TerritoryCalculator(
            instance,
            environment,
            this.instanceFacilityControlFactory,
            this.censusConfig,
        );
    }
}
