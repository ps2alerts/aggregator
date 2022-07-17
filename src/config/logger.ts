import {get} from '../utils/env';
import {config} from 'winston';
import {ConsoleTransportOptions} from 'winston/lib/winston/transports';

export type LogFilter = Array<[string, string | false]>;

export interface TransportsIndex {
    console: ConsoleTransportOptions;
}

export interface TransportConfig<K extends keyof TransportsIndex = keyof TransportsIndex> {
    name: K;
    options: TransportsIndex[K];
    filter?: LogFilter;
}

export default class Logger {
    public readonly levels = config.npm.levels;
    // public readonly level = get('LOG_LEVEL', get('NODE_ENV', 'development') === 'development' ? 'debug' : 'info');
    public readonly level = 'debug';
    public readonly globalFilter: LogFilter = [];
    public readonly transport: string | string[] = get('LOGGER_TRANSPORTS', 'consoleDev').split(',');
    public readonly transports: Record<string, TransportConfig> = {
        consoleColour: {
            name: 'console',
            options: {},
        },
        console: {
            name: 'console',
            options: {},
        },
    };
}
