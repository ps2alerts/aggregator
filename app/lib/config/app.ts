import { get } from '../helpers/env'

export default class App {
    public readonly environment: string = get('ENVIRONMENT')
}