import {ContainerModule} from 'inversify';
import ZoneDataParser from './ZoneDataParser';

export default new ContainerModule((bind) => {
    bind(ZoneDataParser).toSelf().inSingletonScope();
});
