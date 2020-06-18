"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("../helpers/env");
class Database {
    constructor() {
        this.drivers = {
            'primary': {
                host: env_1.get('DATABASE_HOST'),
                port: env_1.getInt('DATABASE_PORT', 3306),
                user: env_1.get('DATABASE_USER', 'root'),
                pass: env_1.get('DATABASE_PASS', 'foobar'),
                database: env_1.get('DATABASE_SCHEMA', 'ps2alerts'),
                ssl: env_1.getBool('DATABASE_SECURE', false),
                sync: env_1.getBool('DATABASE_SYNC', true),
                pool: {
                    max: 100,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                }
            },
            'flags': {
                query_debug: true,
                terminate_on_error: true
            }
        };
    }
}
exports.default = Database;
