"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("../helpers/env");
class App {
    constructor() {
        this.environment = env_1.get('ENVIRONMENT');
    }
}
exports.default = App;
