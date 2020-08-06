import {
    get,
    getInt,
} from '../utils/env';
import {injectable} from 'inversify';

export interface RedisConfig {
    host: string;
    port: number;
    pass: string;
    db: number;
    prefix: string;
}

@injectable()
export default class Redis {
    public readonly config: RedisConfig;

    constructor() {
        // Must match spec as per https://www.npmjs.com/package/redis#rediscreateclient
        this.config = {
            host: get('REDIS_HOST', 'ps2alerts-redis'),
            port: getInt('REDIS_PORT', 6379),
            pass: get('REDIS_AUTH', ''),
            db: getInt('REDIS_DB', 0),
            prefix: 'ps2alerts',
        };
    }
}
