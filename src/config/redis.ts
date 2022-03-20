import {get, getInt} from '../utils/env';
import {injectable} from 'inversify';
import {RedisOptions} from 'ioredis';

@injectable()
export default class Redis implements RedisOptions {
    public readonly host = get('REDIS_HOST', 'ps2alerts-redis');
    public readonly port = getInt('REDIS_PORT', 6379);
    // public readonly username = get('REDIS_USER', '');
    public readonly password = get('REDIS_PASS', '');
    public readonly db = getInt('REDIS_DB', 0);
    public readonly keyPrefix = 'ps2alerts-';
}
