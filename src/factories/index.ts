import {ContainerModule} from 'inversify';
import {TYPES} from '../constants/types';
import InstanceActionFactory from './InstanceActionFactory';

export default new ContainerModule((bind) => {
    bind<InstanceActionFactory>(TYPES.instanceActionFactory).to(InstanceActionFactory).inSingletonScope();
});
