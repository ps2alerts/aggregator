import {inject, injectable} from 'inversify';
import Redis from '../../config/redis';
import {getLogger} from '../../logger';
import {createHandyClient, IHandyRedis} from 'handy-redis';

@injectable()
export class RedisConnection {
    public client: IHandyRedis;

    private static readonly logger = getLogger('RedisConnection');

    private readonly config: Redis;

    private initialized = false;

    constructor(@inject('redisConfig') redisConfig: Redis) {
        this.config = redisConfig;
    }

    public getClient(): IHandyRedis{

        if (this.initialized) {
            return this.client;
        }

        RedisConnection.logger.debug('Creating Redis client...');

        try {
            this.client = createHandyClient(this.config.config);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            RedisConnection.logger.error(`Unable to connect to Redis! ${err}`);
        }

        this.initialized = true;

        return this.client;
    }
}
