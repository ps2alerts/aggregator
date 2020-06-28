import { ContainerModule } from 'inversify';
import { get } from '../utils/env'

export default class App {
    public readonly environment: string = get('ENVIRONMENT')

    /**
     * @return {ContainerModule[]} Modules used by the app
     */
    public get modules(): ContainerModule[] {
        return [
            require('../census').default,
        ];
    }
}
