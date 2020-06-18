"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var winston_1 = require("winston");
var config_1 = require("../config");
/**
 * A default instance of the index
 */
var defaultLogger = winston_1.createLogger({
    level: config_1.default.logger.level,
    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.timestamp(), winston_1.format.printf(function (_a) {
        var timestamp = _a.timestamp, label = _a.label, level = _a.level, message = _a.message;
        return timestamp + " | " + label + " | " + level + " | " + message;
    })),
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
    return defaultLogger.child({ label: label });
}
exports.getLogger = getLogger;
exports.default = defaultLogger;
