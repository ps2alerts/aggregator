import {ContainerModule} from 'inversify';
import {get} from '../utils/env';

export default class App {
    public readonly environment: string = get('NODE_ENV');
    public readonly version: string = get('VERSION');

    /**
     * @return {ContainerModule[]} Modules used by the app
     */
    get modules(): ContainerModule[] {
        /* eslint-disable */
        return [
            require('../authorities').default,
            require('../drivers').default,
            require('../factories').default,
            require('../handlers').default,
            require('../handlers/aggregate').default,
            require('../handlers/ps2census').default,
            require('../services/authorities').default,
            require('../services/census').default,
            require('../services/ps2alerts-api').default,
            require('../services/rabbitmq').default,
            require('../services/redis').default,
        ];
        /* eslint-enable */
    }
}
