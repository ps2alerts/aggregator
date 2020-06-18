import { createLogger, transports, format, Logger } from 'winston'
import config from '../config'

/**
 * A default instance of the index
 */
const defaultLogger = createLogger({
    level: config.logger.level,
    format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({timestamp, label, level, message}) => `${timestamp} | ${label} | ${level} | ${message}`),
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