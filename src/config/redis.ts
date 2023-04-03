import {get, getInt} from '../utils/env';
import {Injectable} from '@nestjs/common';
import {RedisOptions} from 'ioredis';

@Injectable()
export default class Redis implements RedisOptions {
    public readonly host = get('REDIS_HOST', 'ps2alerts-redis');
    public readonly port = getInt('REDIS_PORT', 6379);
    public readonly password = get('REDIS_PASS', '');
}
