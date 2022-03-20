import {injectable} from 'inversify';
import {getLogger} from '../../logger';
import ApplicationException from '../../exceptions/ApplicationException';
import Redis, {Redis as RedisInterface, RedisOptions} from 'ioredis';
import config from '../../config';

@injectable()
export class RedisConnection {
    public client: RedisInterface;
    private static readonly logger = getLogger('RedisConnection');
    private readonly config: RedisOptions = config.redis;
    private initialized = false;

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
