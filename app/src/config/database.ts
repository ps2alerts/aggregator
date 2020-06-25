import {
    get,
    getBool,
    getInt
} from '../utils/env'

export default class Database {
    public readonly drivers: Record<string, unknown> = {
        'primary': {
            host: get('DATABASE_HOST'),
            port: getInt('DATABASE_PORT', 3306),
            user: get('DATABASE_USER', 'root'),
            pass: get('DATABASE_PASS', 'foobar'),
            database: get('DATABASE_SCHEMA', 'ps2alerts'),
            ssl: getBool('DATABASE_SECURE', false),
            sync: getBool('DATABASE_SYNC', true),
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
    }
}
