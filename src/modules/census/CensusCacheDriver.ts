/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types */

import {Injectable} from '@nestjs/common';
import {CacheContract} from 'ps2census';
import Redis from 'ioredis';

// TODO: Add prometheus counters
@Injectable()
export default class CensusCacheDriver implements CacheContract {
    constructor(
        private readonly cacheClient: Redis,
        private readonly namespace: string = 'censusCache',
        private readonly expiry: number = 86400,
    ) {}

    public async forget(key: string): Promise<void> {
        await this.cacheClient.del(this.cacheKey(key)).then((res) => res > 0);
    }

    public async forgetAll(): Promise<void> {
        await this.cacheClient.flushall();
    }

    public async fetch(key: string): Promise<any> {
        // Check if the key actually exists
        if (!await this.cacheClient.exists(this.cacheKey(key))) {
            return '';
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return JSON.parse(
            await this.cacheClient.get(this.cacheKey(key)) ?? '',
        );
    }

    public async put(key: string, data: any): Promise<void> {
        await this.cacheClient.setex(
            this.cacheKey(key),
            this.expiry,
            JSON.stringify(data),
        );
    }

    private cacheKey(key: string): string {
        return `${this.namespace}:${key}`;
    }
}
