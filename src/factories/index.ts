import {ContainerModule} from 'inversify';
import {TYPES} from '../constants/types';
import InstanceActionFactory from './InstanceActionFactory';
import TerritoryCalculatorFactory from './TerritoryCalculatorFactory';
import {Context} from 'inversify/dts/planning/context';
import Census from '../config/census';

export default new ContainerModule((bind) => {
    bind<InstanceActionFactory>(TYPES.instanceActionFactory).to(InstanceActionFactory).inSingletonScope();

    bind<TerritoryCalculatorFactory>(TYPES.territoryCalculatorFactory).toDynamicValue(({container}: Context) => new TerritoryCalculatorFactory(
        container.get(TYPES.instanceFacilityControlModelFactory),
        container.get(Census),
    )).inSingletonScope();
});
