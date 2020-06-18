"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Logger {
    constructor() {
        var _a;
        this.level = (_a = process.env.LOG_LEVEL) !== null && _a !== void 0 ? _a : 'info';
    }
}
exports.default = Logger;
