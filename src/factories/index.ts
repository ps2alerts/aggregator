import {ContainerModule} from 'inversify';
import InstanceActionFactory from './InstanceActionFactory';
import TerritoryCalculatorFactory from './TerritoryCalculatorFactory';

export default new ContainerModule((bind) => {
    bind(InstanceActionFactory).toSelf().inSingletonScope();

    bind(TerritoryCalculatorFactory).toSelf().inSingletonScope();
});
