import {ContainerModule} from 'inversify';
import EventTimingMiddlewareHandler from './EventTimingMiddlewareHandler';
import StatisticsHandler from '../handlers/StatisticsHandler';

export default new ContainerModule((bind) => {
    // This is required as the uniqueID would change every time it's called, which is not what we want as we want it unique for the duration of the app's life.
    // Additionally, it means only one TimingMiddleware exists rather than multiple.
    bind(EventTimingMiddlewareHandler).toDynamicValue(async ({container}) => {
        return new EventTimingMiddlewareHandler(await container.getAsync(StatisticsHandler));
    }).inSingletonScope();
});
