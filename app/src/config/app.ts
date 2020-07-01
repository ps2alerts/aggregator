import { ContainerModule } from 'inversify';
import { get } from '../utils/env';

export default class App {
    public readonly environment: string = get('ENVIRONMENT');
    public readonly version: string = '0.0.1-revive';

    /**
     * @return {ContainerModule[]} Modules used by the app
     */
    public get modules(): ContainerModule[] {
        return [
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            require('../services/census').default,
        ];
    }
}
