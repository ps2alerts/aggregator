/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types */

import {inject, injectable} from 'inversify';
import {RedisConnection} from '../services/redis/RedisConnection';
import {CacheContract} from 'ps2census';
import {Redis} from 'ioredis';

@injectable()
export default class CensusCacheDriver implements CacheContract {
    private readonly namespace: string = 'census';

    private readonly expiry: number = 86400; // 1 day

    private readonly cacheClient: Redis;

    private readonly retrieving = new Map<string, Promise<any>>();

    constructor(
        namespace: string,
        expiry: number,
        @inject(RedisConnection) cacheClient: RedisConnection,
    ) {
        this.namespace = namespace;
        this.expiry = expiry;
        this.cacheClient = cacheClient.getClient();
    }

    public forget(key: string): Promise<boolean> {
        return this.cacheClient.del(this.cacheKey(key)).then((res) => res > 0);
    }

    public async forgetAll(): Promise<void> {
        await this.cacheClient.flushall();
    }

    public async put(key: string, data: any): Promise<void> {
        await this.cacheClient.setex(
            this.cacheKey(key),
            this.expiry,
            JSON.stringify(data),
        );
    }

    public async remember(key: string, cb: () => Promise<any>): Promise<any> {
        let data: any = await this.cacheClient.get(this.cacheKey(key));

        if (!data) {
            let retrieve = this.retrieving.get(key);

            if (!retrieve) {
                retrieve = cb();
                this.retrieving.set(key, retrieve);
            }

            data = await retrieve;
            await this.put(key, data);
            this.retrieving.delete(key);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            data = JSON.parse(data);
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return data;
    }

    private cacheKey(key: string): string {
        return `${this.namespace}-${key}`;
    }
}
