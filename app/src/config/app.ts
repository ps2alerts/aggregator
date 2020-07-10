import {ContainerModule} from 'inversify';
import {get} from '../utils/env';

export default class App {
    public readonly environment: string = get('ENVIRONMENT');

    public readonly version: string = '0.0.1-revive';

    /**
     * @return {ContainerModule[]} Modules used by the app
     */
    get modules(): ContainerModule[] {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return [
            // eslint-disable-next-line
            require('../services/census').default,
            // eslint-disable-next-line
            require('../handlers').default,
        ];
    }
}
