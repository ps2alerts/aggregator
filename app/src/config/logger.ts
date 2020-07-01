import { get } from '../utils/env';

export default class Logger {
    // eslint-disable-next-line yoda
    public readonly level: string = get('NODE_ENV') === 'development' ? 'debug' : 'info';
}
