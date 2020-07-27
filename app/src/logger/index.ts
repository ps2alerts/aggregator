import {createLogger, format, Logger} from 'winston';
import config from '../config';
import {arrayify, transportFactory} from './utils/Helpers';
import filter from './filter';

/**
 * A default instance of the index
 */
const formatting = [
    format.colorize(),
    format.timestamp(),
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    format.printf(({timestamp, level, label, message}) => `${timestamp} | ${level} | ${label} >> ${message}`),
];

if (Object.keys(config.logger.globalFilter).length > 1) {
    formatting.unshift(filter(config.logger.globalFilter)());
}

const defaultLogger = createLogger({
    level: config.logger.level,
    levels: config.logger.levels,
    format: format.combine(
        ...formatting,
    ),
    transports: transportFactory(arrayify(config.logger.transport)
        .map((t) => config.logger.transports[t])),
});

/**
 * Creates a index for a module
 *
 * @param {string} label The name of the module
 */
export function getLogger(label: string): Logger {
    return defaultLogger.child({label});
}

export default defaultLogger;
