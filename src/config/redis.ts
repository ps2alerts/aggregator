import {get, getInt} from '../utils/env';
import {Injectable} from '@nestjs/common';
import {RedisOptions} from 'ioredis';

@Injectable()
export default class Redis implements RedisOptions {
    public readonly host = get('REDIS_HOST', 'ps2alerts-redis');
    public readonly port = getInt('REDIS_PORT', 6379);
    public readonly password = get('REDIS_PASS', '');
    public readonly db = getInt('REDIS_DB', 0);
    public readonly keyPrefix = 'ps2alerts-';
    public readonly metricsListKey = 'metrics-list';
    public readonly itemCacheListKey = 'item-cache-list';
    public readonly unknownFacilityKey = 'unknown-facilities';
    public readonly unknownItemKey = 'unknown-items';
}
