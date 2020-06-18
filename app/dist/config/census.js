"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("../helpers/env");
class Census {
    constructor() {
        this.census = env_1.get('CENSUS_SERVICE_ID');
    }
}
exports.default = Census;
