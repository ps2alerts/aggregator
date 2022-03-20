import MongooseModelFactory from './MongooseModelFactory';
import {InstanceFacilityControlSchemaInterface} from '../models/instance/InstanceFacilityControlModel';
import {inject, injectable} from 'inversify';
import {TYPES} from '../constants/types';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import TerritoryCalculator from '../calculators/TerritoryCalculator';
import {RestClient} from 'ps2census/dist/rest';

@injectable()
export default class TerritoryCalculatorFactory {
    constructor(
        @inject(TYPES.instanceFacilityControlModelFactory) private readonly instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,
    ) {}

    public build(
        instance: MetagameTerritoryInstance,
        restClient: RestClient,
    ): TerritoryCalculator {
        return new TerritoryCalculator(
            instance,
            this.instanceFacilityControlModelFactory,
            restClient,
        );
    }
}
