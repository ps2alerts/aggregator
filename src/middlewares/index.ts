import {ContainerModule} from 'inversify';
import TimingMiddlewareHandler from './TimingMiddlewareHandler';
import {TYPES} from '../constants/types';

export default new ContainerModule((bind) => {
    // This is required as the uniqueID would change every time it's called, which is not what we want as we want it unique for the duration of the app's life.
    // Additionally, it means only one TimingMiddleware exists rather than multiple.
    bind(TimingMiddlewareHandler).toDynamicValue(async ({container}) => {
        return new TimingMiddlewareHandler(await container.getAsync(TYPES.redis));
    }).inSingletonScope();
});
