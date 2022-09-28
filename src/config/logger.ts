import {LogLevel} from '@nestjs/common';
import {get, getBool} from '../utils/env';

export default class Logger {
    public readonly silly = getBool('LOG_SILLY', false);
    public readonly levels = get('LOG_LEVELS', 'error,warn,log').split(',') as LogLevel[];
}
