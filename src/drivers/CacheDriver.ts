import {inject, injectable} from 'inversify';
import {getLogger} from '../logger';
import CacheDriverInterface from '../interfaces/CacheDriverInterface';
import {RedisConnection} from '../services/redis/RedisConnection';
import {IHandyRedis} from 'handy-redis';
import {PS2AlertsCensusCacheTypes} from '../interfaces/PS2AlertsCensusCacheTypes';

@injectable()
export default class CacheDriver implements CacheDriverInterface {
    private static readonly logger = getLogger('CacheDriver');

    private readonly cacheClient: IHandyRedis;

    constructor(@inject(RedisConnection) cacheClient: RedisConnection) {
        this.cacheClient = cacheClient.client;
    }

    public async check(identifier: string, type: PS2AlertsCensusCacheTypes): Promise<number|null> {
        CacheDriver.logger.debug(`Checking Cache for entry ${CacheDriver.buildKey(identifier, type)}`);
        return await this.cacheClient.exists(CacheDriver.buildKey(identifier, type));
    }

    public async get(identifier: string, type: PS2AlertsCensusCacheTypes): Promise<string|null> {
        CacheDriver.logger.debug(`Getting Cache entry ${CacheDriver.buildKey(identifier, type)}`);
        return await this.cacheClient.get(CacheDriver.buildKey(identifier, type));
    }

    public async set(identifier: string, type: PS2AlertsCensusCacheTypes, body: string): Promise<string|null> {
        CacheDriver.logger.debug(`Setting Cache entry ${CacheDriver.buildKey(identifier, type)}`);
        return await this.cacheClient.set(CacheDriver.buildKey(identifier, type), body);
    }

    public async delete(identifier: string, type: PS2AlertsCensusCacheTypes): Promise<number> {
        CacheDriver.logger.debug(`Deleting Cache entry ${CacheDriver.buildKey(identifier, type)}`);
        return await this.cacheClient.del(CacheDriver.buildKey(identifier, type));
    }

    private static buildKey(identifier: string, type: PS2AlertsCensusCacheTypes): string {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        return `${type}-${identifier}`;
    }
}
