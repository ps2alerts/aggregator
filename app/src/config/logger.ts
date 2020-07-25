import {get} from '../utils/env';

export default class Logger {
    public readonly level = get('LOG_LEVEL', get('NODE_ENV', 'development') === 'development' ? 'debug' : 'info');
}
