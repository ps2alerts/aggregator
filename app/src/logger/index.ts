import {createLogger, transports, format, Logger} from 'winston';
import config from '../config';

/**
 * A default instance of the index
 */
const defaultLogger = createLogger({
    level: config.logger.level,
    format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            ({timestamp, level, label, message}) => `${timestamp} | ${level} | ${label} >> ${message}`),
    ),
    transports: [
        new transports.Console(),
    ],
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
