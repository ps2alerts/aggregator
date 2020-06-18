"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const census_1 = __importDefault(require("./census"));
const database_1 = __importDefault(require("./database"));
const features_1 = __importDefault(require("./features"));
const logger_1 = __importDefault(require("./logger"));
/**
 * Holds the configuration information for various aspects of the application.
 */
class Config {
    constructor() {
        this.census = new census_1.default();
        this.database = new database_1.default();
        this.features = new features_1.default();
        this.logger = new logger_1.default();
    }
}
exports.Config = Config;
// This is needed here otherwise we get circular reference issues (e.g. logger calling config for logger information...)
exports.default = new Config();
