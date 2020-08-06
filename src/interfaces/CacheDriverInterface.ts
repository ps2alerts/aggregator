import {PS2AlertsCensusCacheTypes} from './PS2AlertsCensusCacheTypes';

export default interface CacheDriverInterface {
    exists(identifier: string, type: PS2AlertsCensusCacheTypes): Promise<number | null>;

    get(identifier: string, type: PS2AlertsCensusCacheTypes): Promise<string | null>;

    set(identifier: string, type: PS2AlertsCensusCacheTypes, body: string): Promise<string | null>;

    delete(identifier: string, type: PS2AlertsCensusCacheTypes): Promise<number>;
}
