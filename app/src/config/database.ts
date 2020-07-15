import {
    get,
    getInt,
} from '../utils/env';
import {ConnectionOptions} from 'mongoose';
import {injectable} from 'inversify';

export interface DatabaseConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
    schema: string;
}

@injectable()
export default class Database {
    public readonly config: DatabaseConfig;
    public readonly connectionOptions: ConnectionOptions;

    constructor() {
        this.config = {
            host: get('DB_HOST'),
            port: getInt('DB_PORT', 27017),
            user: get('DB_USER', 'root'),
            pass: get('DB_PASS', 'foobar'),
            schema: get('DB_SCHEMA', 'ps2alerts'),
        };

        this.connectionOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: false,
            useCreateIndex: true,
            useFindAndModify: false,
            autoIndex: false,
            poolSize: getInt('DB_POOL_SIZE', 10),
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
            keepAlive: true,
            keepAliveInitialDelay: 30000, // 30 sec
            reconnectTries: 30,
        };
    }
}
