"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = void 0;
const winston_1 = require("winston");
const config_1 = __importDefault(require("../config"));
/**
 * A default instance of the index
 */
const defaultLogger = winston_1.createLogger({
    level: config_1.default.logger.level,
    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.timestamp(), winston_1.format.printf(({ timestamp, label, level, message }) => `${timestamp} | ${label} | ${level} | ${message}`)),
    transports: [
        new winston_1.transports.Console(),
    ],
});
/**
 * Creates a index for a module
 *
 * @param {string} label The name of the module
 */
function getLogger(label) {
    return defaultLogger.child({ label });
}
exports.getLogger = getLogger;
exports.default = defaultLogger;
