import {LogLevel} from '@nestjs/common';
import {get} from '../utils/env';

export default class Logger {
    public readonly silly = false;
    public readonly levels: LogLevel[] = get('LOG_LEVELS', 'error,warn,log').split(',') as any;
}
