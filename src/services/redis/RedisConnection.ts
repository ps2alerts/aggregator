import {inject, injectable} from 'inversify';
import RedisConfig from '../../config/redis';
import {getLogger} from '../../logger';
import ApplicationException from '../../exceptions/ApplicationException';
import Redis, {Redis as RedisInterface} from 'ioredis';

@injectable()
export class RedisConnection {
    public client: RedisInterface;
    private static readonly logger = getLogger('RedisConnection');
    private readonly config: RedisConfig;
    private initialized = false;

    constructor(@inject('redisConfig') redisConfig: RedisConfig) {
        this.config = redisConfig;
    }

    public getClient(): RedisInterface{
        if (this.initialized) {
            return this.client;
        }

        RedisConnection.logger.debug('Creating Redis client...');

        try {
            this.client = new Redis(this.config);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to connect to Redis! ${err}`, 'RedisConnection', 1);
        }

        this.initialized = true;

        RedisConnection.logger.info('Redis Client ready!');

        return this.client;
    }
}
