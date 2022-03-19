import {ContainerModule, interfaces} from 'inversify';
import {TYPES} from '../constants/types';
import InstanceActionFactory from './InstanceActionFactory';
import TerritoryCalculatorFactory from './TerritoryCalculatorFactory';
import Context = interfaces.Context;

export default new ContainerModule((bind) => {
    bind<InstanceActionFactory>(TYPES.instanceActionFactory).to(InstanceActionFactory).inSingletonScope();

    bind<TerritoryCalculatorFactory>(TYPES.territoryCalculatorFactory).toDynamicValue(({container}: Context) => new TerritoryCalculatorFactory(
        container.get(TYPES.instanceFacilityControlModelFactory),
    )).inSingletonScope();
});
