/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types */

import {inject, injectable} from 'inversify';
import {CacheContract} from 'ps2census';
import {Redis} from 'ioredis';
import {TYPES} from '../constants/types';

@injectable()
export default class CensusCacheDriver implements CacheContract {
    constructor(
        @inject(TYPES.redis) private readonly cacheClient: Redis,
        private readonly namespace: string = 'census',
        private readonly expiry: number = 86400,
    ) {}

    public async forget(key: string): Promise<void> {
        await this.cacheClient.del(this.cacheKey(key)).then((res) => res > 0);
    }

    public async forgetAll(): Promise<void> {
        await this.cacheClient.flushall();
    }

    public fetch(key: string): Promise<any> {
        return this.cacheClient.get(key);
    }

    public async put(key: string, data: any): Promise<void> {
        await this.cacheClient.setex(
            this.cacheKey(key),
            this.expiry,
            JSON.stringify(data),
        );
    }

    private cacheKey(key: string): string {
        return `${this.namespace}-${key}`;
    }
}
