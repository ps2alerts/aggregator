import {ContainerModule} from 'inversify';
import {TYPES} from '../constants/types';
import OverdueInstanceAuthority from './OverdueInstanceAuthority';

export default new ContainerModule((bind) => {
    bind(TYPES.overdueInstanceAuthority)
        .to(OverdueInstanceAuthority)
        .inSingletonScope();
});
